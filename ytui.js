var DURATIONFIELDSFLAGS=['s','m','h'];
var DURATIONFIELDS=[];
var MAXVIDEOS=15000; //baseline is loading in 30 second
var FILTERS=['duration','dislikes','likes'];

var totalduration=0;
var descriptions=[];
var images=[];

function parsefilter(id){
  return parseInt(document.querySelector('#'+id).value);
}
function retrieveattribute(element,name){
  var a=element.attributes[name];
  return a&&a.value;
}
function integerattribute(element,attribute){
  return parseInt(retrieveattribute(element,attribute));
}
function checkranges(link){
  for(var i=0;i<FILTERS.length;i++){
    var f=FILTERS[i];
    var value;
    if(f=='duration'){
      value=parseFloat(retrieveattribute(link,'duration'))/60;
    } else{
      value=integerattribute(link,f);
    }
    if(!(parsefilter('min'+f)<=value&&value<=parsefilter('max'+f))){
      return false;
    }
  }
  return true;
}
function checkquery(link){
  var html=link.innerHTML.toLowerCase();
  var terms=document.querySelector('#filterquery').value.trim();
  if(!terms){
    return true;
  }
  terms=terms.toLowerCase().split('\n');
  for(var i=0;i<terms.length;i++){
    if(html.indexOf(terms[i].trim())>=0){
      return false;
    }
  }
  return true;
}
function filter(){
  var videos=document.querySelector('#videos');
  var videosparent=videos.parentNode;
  videosparent.removeChild(videos); //prevents reflow
  var links=videos.querySelectorAll('.video');
  for (var i=0;i<links.length;i++){
    var link=links[i];
    link.style['display']=checkranges(link)&&checkquery(link)?'table-row':'none';
  }
  videosparent.appendChild(videos);
}
function getuploader(video){
  return video.getAttribute('user');
}
function hideuser(user,me){
  while(!me.classList.contains('video')){
    me=me.parentNode;
  }
  var videos=document.querySelectorAll('.video');
  var i=0;
  for(;i<videos.length;i++){
    if(me==videos[i]){
      break;
    }
  }
  var next=false;
  for(;i<videos.length;i++){
    next=videos[i];
    if(getuploader(next)!=getuploader(me)){
      break;
    }
  }
  var lines=document.querySelectorAll('.video[user='+user+']');
  for (var i=0;i<lines.length;i++){
    var line=lines[i];
    line.parentNode.removeChild(line);    
  }
  next.scrollIntoView();
}
function showdescription(i){
  alert(descriptions[i]);
}
function changeattribute(node,attribute,value){
  node.attributes[attribute].value=value;
}
function clicktitle(title,item){
  var parent=title.parentNode;
  changeattribute(parent,'collapse','no');
  changeattribute(title,'onclick','');
  changeattribute(parent.querySelector('img'),'src',images[item]);
  return false;
}
function expandall(){
  var videos=document.querySelectorAll('.video');
  for (var i=0;i<videos.length;i++) {
    var video=videos[i];
    if (video.attributes.collapse.value=='yes'){
      video.querySelector('a').click();
    }
  }
}
function createElement(tag){
  return document.createElement(tag);
}
function createFullElement(tag,parent,content){
  var element=createElement(tag);
  parent.appendChild(element);
  element.outerHTML=content;
  return element;
}
function detach(){
  var style=document.querySelector('#querybox').style;
  style['position']='fixed';
  style['right']='1em';
  style['top']='1em';
  document.querySelector('#querybox button').style['display']='block';
}
function start(){
  var extra=document.body.getAttribute('extrafilters');
  if(extra){
    extra=extra.split(' ');
    for(var i=0;i<extra.length;i++){
      var newfilter=extra[i];
      FILTERS.push(newfilter);
      var li=document.createElement('li');
      li.innerHTML='<input value="0" id="min'+newfilter+'"/> and \
        <input value="99999999" id="max'+newfilter+'"/> '+newfilter;
      document.querySelector('ul').appendChild(li);
    }
  }
  filter();
}
//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) { 
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}
function shufflevideos(){
  let parent=document.querySelector('#videos');
  let videos=document.querySelectorAll('.video');
  for(let v of shuffle(Array.from(videos))){
      parent.removeChild(v);
      parent.appendChild(v);
  }
}

for (var i=0;i<DURATIONFIELDSFLAGS.length;i++){
  var flag=DURATIONFIELDSFLAGS[i];
  DURATIONFIELDS[flag]=Math.pow(60,i);
}

if(!window.ytuilinkprefix){
  window.ytuilinkprefix='http://www.youtube.com/watch?v=';
}
var originallength=ytuidata.length;
var removed=originallength-MAXVIDEOS;
var html=[];
if (removed>0){
  ytuidata.splice(removed,removed);
  html.push('Removed last '+removed+' videos ('+Math.round(100*removed/originallength)+'% total) to ensure the '+MAXVIDEOS+' limit.<br/><br/>');
}
html.push('Show videos between:\
  <ul>\
    <li><input value="0"\ id="minduration"/> and \
    <input value="36000" id="maxduration"/> minutes</li>\
    <li><input value="1" id="minlikes"/> and \
    <input value="99999999" id="maxlikes"/> likes</li>\
    <li><input value="0" id="mindislikes"/> and \
    <input value="99999999" id="maxdislikes"/> dislikes</li>\
  </ul>\
  Hide items containing the following terms (one per line):<br/>\
  <div id="querybox">\
    <textarea id="filterquery"></textarea>\
    <br/><button onclick="filter()">Filter</button>\
  </div>\
  <br/>\
  <button onclick="filter()">Filter</button>\
  <button onclick="expandall()">Expand all</button>\
  <button onclick="detach()">Detach filter box</button>\
  <button onclick="shufflevideos()">Shuffle</button>\
  <br/>');
html.push('<span id="videos">');
for (var i=0;i<ytuidata.length;i++){
  var item=ytuidata[i];
  var channelid=item['channelId'];
  var duration=0;
  var descritiveduration=item['duration'].substr(2);
  var isoduration=descritiveduration.toLowerCase();
  var isodurationdefield='';
  for (var j=0;j<isoduration.length;j++){
    var character=isoduration[j];
    if (isNaN(character)){
      duration+=parseInt(isodurationdefield)*DURATIONFIELDS[character];
      isodurationdefield='';
    } else {
      isodurationdefield+=character;
    }
  }
  totalduration+=duration;
  var stats=item['stats'];
  if(stats){
    stats+=' ';
  }else{
    stats='';
  }
  var videoinfo=stats+'likes="'+item['likes']+'" dislikes="'+item['dislikes']+'"'+' duration="';
  descriptions[i]=item.description;
  images[i]=item['image'];
  html.push(
    '<div '+videoinfo+duration+'" class="video" user="'+channelid+'" collapse="yes">'+
      '<a href="'+
      ytuilinkprefix+
      item['id']+
      '" target="_blank" onclick="return clicktitle(this,'+i+');" title=\''+
      videoinfo+descritiveduration+
      '"\'>'+
        '<img src=""/>'+
        '<div class="title">'+item['title']+'</div>'+
      '</a>'+
      '<br/>'+
      '<div class="actions">'+
        '<button onclick="hideuser(\''+channelid+'\',this)">Hide user</button>'+
        '<button onclick="showdescription('+i+')">Description</button>'+
        '<br/>'+
        '<a href="http://www.youtube.com/channel/'+
        channelid+
        '/videos?view=1&flow=grid" target="blank">'+
          item['channel']+
        '</a>'+
      '</div>'+
    '</div>');
}
html.push('</span>');
document.body.innerHTML+=html.join('');
document.body.onload=start;
//collect garbage
ytuidata=false; 
html=false;
