window.evTriggerUpload = function(){ document.getElementById('ev-fileInput').click(); };
(function(){
  var EV_MONTHS=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  var evEvents=[],evOpenIdx=-1;
  function evShow(id){document.getElementById(id).classList.remove("ev-hidden");}
  function evHide(id){document.getElementById(id).classList.add("ev-hidden");}
  /* Hide event section immediately via class - immune to Jekyll inline-style stripping */
  function evInit(){evHide("ev-eventSection");evHide("ev-statusMsg");}
  if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",evInit);}else{evInit();}
  function evDragOver(e){e.preventDefault();document.getElementById("ev-dropZone").classList.add("ev-drag");}
  function evDragLeave(e){document.getElementById("ev-dropZone").classList.remove("ev-drag");}
  function evDrop(e){e.preventDefault();document.getElementById("ev-dropZone").classList.remove("ev-drag");var f=e.dataTransfer.files[0];if(f)evLoadFile(f);}
  function evLoadFile(file){
    if(!file)return;
    var r=new FileReader();
    r.onload=function(e){
      try{
        var wb=XLSX.read(e.target.result,{type:"array"});
        var ws=wb.Sheets[wb.SheetNames[0]];
        var rows=XLSX.utils.sheet_to_json(ws,{defval:""});
        if(!rows.length){evSetStatus("The spreadsheet appears to be empty.",true);return;}
        var keys=Object.keys(rows[0]).map(function(k){return k.toLowerCase().trim();});
        if(keys.indexOf("month")===-1||keys.indexOf("day")===-1||keys.indexOf("title")===-1){
          evSetStatus("Could not find required columns: Month, Day, Title. Check row 1 matches the template.",true);return;
        }
        function gc(row,col){var k=Object.keys(row).find(function(k){return k.toLowerCase().trim()===col;});return String(row[k]||"").trim();}
        evEvents=rows.map(function(r){return{month:gc(r,"month").toUpperCase().slice(0,3),day:parseInt(gc(r,"day"))||0,title:gc(r,"title"),time:gc(r,"time")||"All Day",cat:gc(r,"category"),detail:gc(r,"details"),ics:gc(r,"ics link")};}).filter(function(e){return e.month&&e.day&&e.title;});
        evEvents.sort(function(a,b){return(EV_MONTHS.indexOf(a.month)*31+a.day)-(EV_MONTHS.indexOf(b.month)*31+b.day);});
        evOpenIdx=-1;evSetStatus("");evHide("ev-uploadSection");evShow("ev-eventSection");
        document.getElementById("ev-countLabel").textContent=evEvents.length+" event"+(evEvents.length!==1?"s":"")+" loaded";
        evRender();
      }catch(err){evSetStatus("Could not read the file. Please make sure it is a valid .xlsx file.",true);}
    };
    r.readAsArrayBuffer(file);
  }
  function evEsc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
  function evRender(){
    var list=document.getElementById("ev-eventList");
    if(!evEvents.length){list.innerHTML="<div class=\"ev-status\">No events found in this file.</div>";return;}
    list.innerHTML=evEvents.map(function(ev,i){
      var open=evOpenIdx===i;
      var dh=ev.detail?"<p>"+ev.detail.replace(/\n/g,"<br>")+"</p>":"<p><em>No additional details provided.</em></p>";
      var ih=ev.ics?"<a class=\"ev-cal-link\" href=\""+evEsc(ev.ics)+"\" target=\"_blank\" rel=\"noopener\">&#128197; Add to my calendar</a>":"";
      return "<div role=\"listitem\"><div class=\"ev-row\" onclick=\"evToggle("+i+")\" role=\"button\" tabindex=\"0\" aria-expanded=\""+open+"\" onkeydown=\"if(event.key==='Enter'||event.key===' ')evToggle("+i+")\">"+
        "<div class=\"ev-badge\" aria-hidden=\"true\"><span class=\"ev-month\">"+evEsc(ev.month)+"</span><span class=\"ev-day\">"+ev.day+"</span></div>"+
        "<div class=\"ev-body\"><div class=\"ev-title\">"+evEsc(ev.title)+"</div><div class=\"ev-time\">"+evEsc(ev.time)+"</div>"+(ev.cat?"<div class=\"ev-cat\">"+evEsc(ev.cat)+"</div>":"")+"</div>"+
        "<div class=\"ev-arrow"+(open?" open":"")+"\" aria-hidden=\"true\"><svg class=\"ev-chevron\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 6l6 6-6 6\"/></svg></div></div>"+
        "<div class=\"ev-detail"+(open?"":" ev-hidden")+"\" role=\"region\">"+dh+ih+"</div></div>";
    }).join("");
  }
  function evToggle(i){evOpenIdx=(evOpenIdx===i)?-1:i;evRender();}
  function evResetView(){evEvents=[];evOpenIdx=-1;evHide("ev-eventSection");evShow("ev-uploadSection");document.getElementById("ev-fileInput").value="";evSetStatus("");}
  function evSetStatus(msg,isErr){
    var el=document.getElementById("ev-statusMsg");
    if(msg){el.className="ev-status"+(isErr?" err":"");el.textContent=msg;evShow("ev-statusMsg");}
    else{el.className="";el.textContent="";evHide("ev-statusMsg");}
  }
  function evDownloadTemplate(e){
    e.stopPropagation();
    var wb=XLSX.utils.book_new();
    var data=[["Month","Day","Title","Time","Category","Details","ICS Link"],["MAY","18","Early Release All Levels","All Day","Early Release Day - All levels","11:30am High Schools\n12:30pm Elementary Schools\n1:30pm Middle Schools",""],["MAY","20","Last Day of School","All Day","First and Last Days of School","Last Day of School for all students.",""],["JUN","9","Summer Term Begins","All Day","Term Dates","Summer Term 2026 begins. Log in to CTLS Learn to access courses.",""],["AUG","4","Fall Registration Opens","9:00am - 4:00pm","Registration","Registration is open for the Fall 2026 term.",""]];
    var ws=XLSX.utils.aoa_to_sheet(data);ws["!cols"]=[{wch:8},{wch:6},{wch:34},{wch:22},{wch:30},{wch:44},{wch:44}];
    XLSX.utils.book_append_sheet(wb,ws,"Events");XLSX.writeFile(wb,"CVA_Events_Template.xlsx");
  }
  window.evToggle=evToggle;window.evResetView=evResetView;window.evLoadFile=evLoadFile;
  window.evDragOver=evDragOver;window.evDragLeave=evDragLeave;window.evDrop=evDrop;window.evDownloadTemplate=evDownloadTemplate;
})();

(function(){
  var inputEl=document.getElementById("cva-input"),clearBtn=document.getElementById("cva-clear"),resultsEl=document.getElementById("search-results");
  document.querySelectorAll("details.quick-ref").forEach(function(d){d.style.display="block";d.removeAttribute("hidden");d.removeAttribute("open");});
  var sectionIcons={"Grading and Feedback":"ti-checklist","Communication and Responsiveness":"ti-mail","Rapport and Relationships":"ti-heart","Proactive Intervention and Student Support":"ti-alert-circle","Professionalism and Collaboration":"ti-users"};
  var cards=Array.from(document.querySelectorAll(".info-card[id]")).map(function(el){
    var title=(el.querySelector("h3")||{}).textContent||"",label=(el.querySelector(".info-card-label")||{}).textContent||"",tags=(el.querySelector(".info-card-tags")||{}).textContent||"";
    var acc=el.closest("details.quick-ref"),sumEl=acc?acc.querySelector("summary"):null,section="";
    if(sumEl){var clone=sumEl.cloneNode(true);var pe=clone.querySelector(".quick-plus");if(pe)pe.remove();section=clone.textContent.trim();}
    return{id:el.id,title:title.trim(),label:label.trim(),tags:tags.trim(),section:section};
  });
  var ht=null;
  function iconFor(s){return sectionIcons[s]||"ti-file";}
  function getText(){return(inputEl.textContent||inputEl.innerText||"").trim();}
  function clearRes(){resultsEl.innerHTML="";resultsEl.classList.remove("visible");}
  function scrollTo(id){var c=document.getElementById(id);if(!c)return;var a=c.closest("details.quick-ref");if(a)a.open=true;c.scrollIntoView({behavior:"smooth",block:"center"});c.classList.add("card-highlight");clearTimeout(ht);ht=setTimeout(function(){c.classList.remove("card-highlight");},5000);}
  function renderRes(matches,term){
    if(!term){clearRes();clearBtn.classList.add("ev-hidden");return;}
    clearBtn.classList.remove("ev-hidden");resultsEl.classList.add("visible");
    if(!matches.length){resultsEl.innerHTML="<div class=\"results-list\"><div class=\"results-empty\">No results found for &ldquo;"+term+"&rdquo;</div></div>";return;}
    var rows=matches.map(function(c){return "<div class=\"result-item\" data-id=\""+c.id+"\"><div class=\"result-icon\"><i class=\"ti "+iconFor(c.section)+"\" aria-hidden=\"true\"></i></div><div><div class=\"result-title\">"+c.title+"</div><div class=\"result-section\">"+c.section+"</div></div></div>";}).join("");
    resultsEl.innerHTML="<div class=\"results-list\">"+rows+"<div class=\"results-hint\">Click a result to jump to that card</div></div>";
    resultsEl.querySelectorAll(".result-item").forEach(function(item){item.addEventListener("click",function(){scrollTo(item.dataset.id);});});
  }
  function doSearch(){var t=getText().toLowerCase();if(!t){clearRes();clearBtn.classList.add("ev-hidden");return;}var m=cards.filter(function(c){return(c.title+" "+c.label+" "+c.section+" "+c.tags).toLowerCase().includes(t);});renderRes(m,t);}
  inputEl.addEventListener("input",doSearch);
  inputEl.addEventListener("keydown",function(e){if(e.keyCode===13)e.preventDefault();});
  inputEl.addEventListener("paste",function(e){e.preventDefault();var t=(e.clipboardData||window.clipboardData).getData("text/plain");document.execCommand("insertText",false,t);});
  clearBtn.addEventListener("click",function(){inputEl.textContent="";clearRes();clearBtn.classList.add("ev-hidden");inputEl.focus();});
  clearBtn.addEventListener("keydown",function(e){if(e.keyCode===13||e.keyCode===32){e.preventDefault();inputEl.textContent="";clearRes();clearBtn.classList.add("ev-hidden");inputEl.focus();}});
})();