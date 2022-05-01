const fs = require('fs');

try {
  const data = fs.readFileSync('input1.csv', 'utf8');
  var records = data.split(/\r?\n/);
  var fields = [];
  var subfilters = [];
  var tagnames = [];
  var endresult = [];
  var tagindex = [];
  var row = [];
  var itemrow = {};
  var totaldata = [];
  var totaldatagroup = [];
  var eids = [];

  const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

  for(var i = 0;i < records.length;i++){
    //console.log('record:' + records[i] );
    if(i == 0){
        //format data:
        var fieldswtreat = records[i].split(',');
        for(var j = 0;j < fieldswtreat.length;j++){
           //check if sublevel
           var item = fieldswtreat[j];
           if(item.indexOf(' ') > 0){
               var field = item.split(' ')[0];
               field = field.replace('"','');
               //first field:
               if(fields.indexOf(field) < 0){
                    fields[fields.length] = field; 
                    //console.log('first point:' + item);
                    tagnames = item.split(' ');
                    tagnames.shift();
                    tagindex = [];
                    for(var ti = 0;ti < tagnames.length;ti++){
                        tagindex[tagindex.length] = JSON.stringify({position:j,tag:tagnames[ti]});
                    }
                    subfilters[subfilters.length] = {field:field,tags:tagnames,tagindex:tagindex,position:j};
               }else{
                    //console.log('no negative:' + field);
                    for(var t = 0;t < subfilters.length;t++){
                        if(subfilters[t].field == field){
                            //console.log('subfilters-located:' + subfilters[t].field);
                            //console.log('subfilters-items:' + item);
                            var tagadd = item.replace(field,'');
                            tagadd = tagadd.replace(' ','');
                            tagadd = tagadd.replace('"','');
                            tagadd = tagadd.replace('"','');
                            tagadd = tagadd.replace("\"","");
                            //console.log(tagadd);
                            if(subfilters[t].tags.indexOf(tagadd)<0){
                                subfilters[t].tags[subfilters[t].tags.length] = tagadd;
                                subfilters[t].tagindex[subfilters[t].tagindex.length] = JSON.stringify({position:j,tag:tagadd});
                                subfilters[t].position=j;
                                //console.log('atualizar posicao:' + field);
                            }
                            
                        }
                    }
               }
           }else{
               //first level:
               if(fields.indexOf(item) < 0){
                 fields[fields.length] = item;
                 var groupindex = [j];
                 subfilters[subfilters.length] = {field:item,tags:[],tagindex:[],position:j,groupindex:groupindex};
               }else{
                 for(var gi = 0;gi < subfilters.length;gi++){
                    if(subfilters[gi].field == item){
                        subfilters[gi].groupindex[subfilters[gi].groupindex.length] = j;
                    }
                 }
               }
           }

        }
      // console.log(subfilters);
    }else{
        //get rows:
        var rowcom = records[i];
        
        var nextsep = 0;
        if(rowcom.indexOf('"') > 0 ){
            while(rowcom.indexOf('"')>0){
                var firstpoint = rowcom.indexOf('"');
                var lastpoint = rowcom.indexOf('"',firstpoint+1);
                var block = rowcom.substring(firstpoint,lastpoint);
                
                while(block.indexOf(',') > 0){
                    block = block.replace(',','/');
                }
                block = block.replace('"',',');
                //console.log('bloco:');
                rowcom = rowcom.substring(0,firstpoint-1) + block + rowcom.substring(lastpoint+1,rowcom.length);
                //console.log(rowcom);
            }
            row = rowcom.split(',')
        }else
            row = records[i].split(',');

        itemrow = {};
        for(var ff = 0;ff < subfilters.length;ff++){
            var def = subfilters[ff];
            if(def.tagindex.length==0){
                itemrow[def.field]='';
                for(var gi = 0;gi < def.groupindex.length;gi++){
                    itemrow[def.field] += row[def.groupindex[gi]] + '/';
                    //if(def.field=='group')
                    //    console.log(row[def.groupindex[gi]]);
                }
                //check if invisible field:
                if(def.field=='invisible'){
                    //console.log(itemrow[def.field]);
                    if(itemrow[def.field]!='1/' && itemrow[def.field]!='yes/' && itemrow[def.field]!='0/' && itemrow[def.field]!='/' ){
                        //itemrow['group'] += '/' + row[def.position] + '/';
                        if(subfilters[ff+1]!=undefined){
                            var definvisible = subfilters[ff+1];
                            itemrow[def.field]= row[definvisible.position];
                        }
                    }
                }else if(def.field=='see_all'){
                    if(itemrow[def.field]!='yes/' && itemrow[def.field]!='no/' ){
                        //console.log('on condition:' + itemrow[def.field]);
                        if(subfilters[ff+1]!=undefined){
                            var defsee = subfilters[ff+1];
                            itemrow[def.field]= row[defsee.position];
                        }else if(itemrow[def.field]=='1/' ){
                            itemrow[def.field]='yes/';
                        }else{
                            itemrow[def.field]='no/';
                        }
                        
                    }
                }

                if(itemrow[def.field].length>1)
                    itemrow[def.field] = itemrow[def.field].substring(0,itemrow[def.field].length-1);
                
            }else{
                //console.log('has keys');
                for(var tit = 0;tit < def.tagindex.length;tit++){
                    var ptit = JSON.parse(def.tagindex[tit]);
                    //console.log(ptit);
                    if(itemrow.addresses==undefined)
                        itemrow["addresses"] = [];

                    //console.log(ptit.tag.split(' '));
                    var tagsr = ptit.tag.split(' ');

                    itemrow.addresses[itemrow.addresses.length] = {
                        type: def.field,
                        tags: JSON.stringify(tagsr),
                        address: row[ptit.position]
                    }
                }
            }
        }

        
        if(itemrow['invisible'] != '1' && itemrow['invisible'] != '0'){
            //console.log('there:' + itemrow['invisible']);
            if(itemrow['invisible']=='yes')
                itemrow['invisible']='1';
            else
                itemrow['invisible']='0';
        }

        if(itemrow['see_all']=='1'){
           itemrow['see_all']='yes';
        }

        if(itemrow['see_all'] != 'no' && itemrow['see_all'] != 'yes' ){
          //console.log('see nop:' + itemrow['see_all']);
          itemrow['see_all']='no';
        }//}else{
        //    console.log('see found:' + itemrow['see_all']);
        //}

        if(itemrow['group'].indexOf('/') > -1 ){
            itemrow['group'] = itemrow['group'].split('/');
        }

        itemrow.addresses= JSON.stringify(itemrow.addresses);

        //console.log(itemrow);
        totaldata[totaldata.length] = itemrow;
    }
  }

  //now I need to do a group:
  for(var i = 0;i < totaldata.length;i++){
      if(eids.length==0){
          eids[eids.length] = totaldata[i].eid;
          totaldatagroup[totaldatagroup.length] = totaldata[i];
          joingroup = [];
            currgroup = totaldatagroup[totaldatagroup.length-1].group;
            for(var g = 0;g < currgroup.length;g++){
                var treatitem = currgroup[g];
                treatitem = (treatitem.length > 1 && treatitem.substring(0,1) == ' '?treatitem.substring(1,treatitem.length):treatitem);
                treatitem = (treatitem.length > 1 && treatitem.indexOf('"') >= 0?treatitem.replace('"',''):treatitem);
                treatitem = (treatitem.length > 1 && treatitem.indexOf("\"") >= 0?treatitem.replace('\"',''):treatitem);
                if(treatitem != '' && joingroup.includes(treatitem) == false ){
                    joingroup[joingroup.length] = treatitem;
                }
            }
            totaldatagroup[totaldatagroup.length-1].group=joingroup;
      }else{
          var eid = totaldata[i].eid;
          if(eids.indexOf(eid) >= 0){
            for(var prev=0;prev < totaldatagroup.length;prev++){
                var previtem = totaldatagroup[prev];
                if(previtem.eid == totaldata[i].eid){
                    var prevgroup = previtem.group;
                    var prevaddress = JSON.parse(previtem.addresses);
                    var curraddress = JSON.parse(totaldata[i].addresses);

                    //prevaddress.concat(curraddress);
                    for(var adda = 0;adda < curraddress.length;adda++){
                        prevaddress[prevaddress.length] = curraddress[adda];
                    }

                    var currgroup = totaldata[i].group;
                    var joingroup = [];
                    
                    for(var g = 0;g < prevgroup.length;g++){
                        var treatitem = prevgroup[g];
                        treatitem = (treatitem.length > 1 && treatitem.substring(0,1) == ' '?treatitem.substring(1,treatitem.length):treatitem);
                        treatitem = (treatitem.length > 1 && treatitem.indexOf('"') >= 0?treatitem.replace('"',''):treatitem);
                        treatitem = (treatitem.length > 1 && treatitem.indexOf("\"") >= 0?treatitem.replace('\"',''):treatitem);
                        if(treatitem != '' && joingroup.includes(treatitem) == false ){
                            joingroup[joingroup.length] = treatitem;
                        }
                    }
                    for(var g = 0;g < currgroup.length;g++){
                        var treatitem = currgroup[g];
                        treatitem = (treatitem.length > 1 && treatitem.substring(0,1) == ' '?treatitem.substring(1,treatitem.length):treatitem);
                        treatitem = (treatitem.length > 1 && treatitem.indexOf('"') >= 0?treatitem.replace('"',''):treatitem);
                        treatitem = (treatitem.length > 1 && treatitem.indexOf("\"") >= 0?treatitem.replace('\"',''):treatitem);
                        if(treatitem != '' && joingroup.includes(treatitem) == false ){
                            joingroup[joingroup.length] = treatitem;
                        }
                    }
                    totaldatagroup[prev].group = joingroup;
                    totaldatagroup[prev].addresses = JSON.stringify(prevaddress);
                }
            }
          }else{
            eids[eids.length] = totaldata[i].eid;
            totaldatagroup[totaldatagroup.length] = totaldata[i];
            joingroup = [];
            currgroup = totaldatagroup[totaldatagroup.length-1].group;
            for(var g = 0;g < currgroup.length;g++){
                var treatitem = currgroup[g];
                treatitem = (treatitem.length > 1 && treatitem.substring(0,1) == ' '?treatitem.substring(1,treatitem.length):treatitem);
                treatitem = (treatitem.length > 1 && treatitem.indexOf('"') >= 0?treatitem.replace('"',''):treatitem);
                if(treatitem != '' && joingroup.includes(treatitem) == false ){
                    joingroup[joingroup.length] = treatitem;
                }
            }
            totaldatagroup[totaldatagroup.length-1].group=joingroup;
          }
      }
  }

  //console.log(subfilters);
  //console.log(totaldatagroup);
  for(var i = 0;i < totaldatagroup.length;i++){
    totaldatagroup[i].addresses=JSON.parse(totaldatagroup[i].addresses);
    totaldatagroup[i].invisible = (totaldatagroup[i].invisible=='1'?true:false);
    totaldatagroup[i].see_all = (totaldatagroup[i].see_all=='yes'?true:false);
    for(var j = 0;j < totaldatagroup[i].addresses.length;j++){
        //console.log(totaldatagroup[i].addresses[j].tags);
        try{
            totaldatagroup[i].addresses[j].tags = JSON.parse(totaldatagroup[i].addresses[j].tags);
            //console.log(totaldatagroup[i].addresses[j].tags);
            for(var tr = 0;tr < totaldatagroup[i].addresses[j].tags.length;tr++){
                totaldatagroup[i].addresses[j].tags[tr] = totaldatagroup[i].addresses[j].tags[tr].replace("\"","");
            }
            //console.log(totaldatagroup[i].addresses[j].tags);
        }catch{
            //convert only if possible
        }
        var itemvalidate = totaldatagroup[i].addresses[j];
        if(itemvalidate.type=='email'){
            itemvalidate.address = itemvalidate.address.replace(' ','').replace(':','').replace('(','');
            if(itemvalidate.address.indexOf('/') < 0 ){
                //console.log(itemvalidate.address);
                totaldatagroup[i].addresses[j].address=itemvalidate.address;
                if(totaldatagroup[i].addresses[j].address=="" 
                || totaldatagroup[i].addresses[j].address.indexOf('.com') < 0
                || totaldatagroup[i].addresses[j].address.indexOf('@') < 0
                ){
                    totaldatagroup[i].addresses.splice(j,1);
                    j=j-1;
                }
            }else{
                var emails = itemvalidate.address.split('/');
                
                for(var ce = 0;ce < emails.length;ce++){
                    if(emails[ce].indexOf('.com') < 0 || emails[ce].indexOf('@') < 0){
                        emails.splice(ce,1);
                        ce=ce-1;
                    }
                }

                if(emails.length > 0)
                    totaldatagroup[i].addresses[j].address=emails[0];
                else {
                    totaldatagroup[i].addresses.splice(j,1);
                    j=j-1;
                }
                    
                for(var ea = 0;ea < emails.length;ea++){
                    if(ea > 0){
                        try{
                            totaldatagroup[i].addresses[j].address=emails[0];
                            totaldatagroup[i].addresses[totaldatagroup[i].addresses.length] = {type:itemvalidate.type,tags:itemvalidate.tags,address:itemvalidate.address};
                            totaldatagroup[i].addresses[totaldatagroup[i].addresses.length-1].address=emails[ea];
                            //console.log('size-after:' + totaldatagroup[i].addresses.length);
                            //console.log(totaldatagroup[i].addresses);
                        }catch{
                            //console.log(itemvalidate);
                        }
                        
                    }
                }
            }
        }else if(itemvalidate.type=='phone'){
            try{
                //console.log(itemvalidate.address);
                //console.log(phoneUtil.isValidNumberForRegion(phoneUtil.parse(itemvalidate.address, 'BR'), 'BR'));
    
                if(phoneUtil.isValidNumberForRegion(phoneUtil.parse(itemvalidate.address, 'BR'), 'BR')==true){
                    //console.log('teste');
                    //var phone = phoneUtil.parseAndKeepRawInput(phoneUtil.parse(itemvalidate.address, 'BR'), 'BR');
                    var country = phoneUtil.parse(itemvalidate.address, 'BR').getCountryCode()
                    var phone = phoneUtil.parse(itemvalidate.address, 'BR').getNationalNumber();
                    phone = country.toString() +phone.toString();
                    //console.log('passou conversao');
                    //console.log(phone);
                    totaldatagroup[i].addresses[j].address=phone;
                    if(totaldatagroup[i].addresses[j].address.length <= 12){
                        totaldatagroup[i].addresses.splice(j,1);
                        j=j-1;
                    }
                }else{
                    totaldatagroup[i].addresses.splice(j,1);
                    j=j-1;
                }
            }catch{
                //totaldatagroup[i].addresses[j].address='0';
                //console.log(totaldatagroup[i].addresses[j].address);
                totaldatagroup[i].addresses.splice(j,1);
                j=j-1;
            }
            
        }
    }
  }

  //just to adjust name from group to groups:
  var justsemantic = [];
  for(var i = 0;i < totaldatagroup.length;i++){
    justsemantic[justsemantic.length] = {
        fullname:totaldatagroup[i].fullname,
        eid:totaldatagroup[i].eid,
        groups:totaldatagroup[i].group,
        addresses:totaldatagroup[i].addresses,
        invisible:totaldatagroup[i].invisible,
        see_all:totaldatagroup[i].see_all,
    }
  }

  let outdata = JSON.stringify(justsemantic);
  fs.writeFileSync('output7.json', outdata);
} catch (err) {
  console.error(err);
}

