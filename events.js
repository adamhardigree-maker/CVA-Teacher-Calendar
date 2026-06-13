window.evTriggerUpload=function(){document.getElementById('ev-fileInput').click();};

(function(){
  var SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRRMYiPX6uQKZ1tw8Ep2pVMmT86hGzMMHI8JfuQSfKJPUquuXcavHFMgRfIzZUJOg/pub?output=csv';
  var EV_MONTHS=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  var evEvents=[],evOpenIdx=-1;

  function evShow(id){document.getElementById(id).classList.remove("ev-hidden");}
  function evHide(id){document.getElementById(id).classList.add("ev-hidden");}

  function evInit(){
    evHide("ev-statusMsg");
    evSetStatus("Loading events...", false);
    evShow("ev-statusMsg");
    fetchSheet();
  }

  function fetchSheet(){
    fetch(SHEET_URL)
      .then(function(r){ return r.text(); })
      .then(function(csv){ parseCSV(csv); })
      .catch(function(){ evSetStatus("Could not load events. Please try refreshing the page.", true); });
  }

  function parseCSV(csv){
    var lines = csv.split("\n").map(function(l){ return l.trim(); }).filter(function(l){ return l.length > 0; });
    if(lines.length < 2){ evSetStatus("No events found in the spreadsheet.", true); return; }

    var headers = lines[0].split(",").map(function(h){ return h.trim().toLowerCase().replace(/"/g,""); });
    var iMonth = headers.indexOf("month");
    var iDay = headers.indexOf("day");
    var iTitle = headers.indexOf("title");
    var iTime = headers.indexOf("time");
    var iCat = headers.indexOf("category");
    var iDetail = headers.indexOf("details");
    var iIcs = headers.indexOf("ics link");

    if(iMonth===-1||iDay===-1||iTitle===-1){
      evSetStatus("Spreadsheet missing required columns: Month, Day, Title.", true); return;
    }

    evEvents = [];
    for(var i=1;i<lines.length;i++){
      var cols = splitCSVRow(lines[i]);
      var month = (cols[iMonth]||"").trim().toUpperCase().slice(0,3);
      var day = parseInt((cols[iDay]||"").trim());
      var title = (cols[iTitle]||"").trim();
      if(!month||!day||!title) continue;
      evEvents.push({
        month: month,
        day: day,
        title: title,
        time: iTime>-1 ? (cols[iTime]||"All Day").trim() : "All Day",
        cat: iCat>-1 ? (cols[iCat]||"").trim() : "",
        detail: iDetail>-1 ? (cols[iDetail]||"").trim() : "",
        ics: iIcs>-1 ? (cols[iIcs]||"").trim() : ""
      });
    }

    evEvents.sort(function(a,b){
      return(EV_MONTHS.indexOf(a.month)*31+a.day)-(EV_MONTHS.indexOf(b.month)*31+b.day);
    });

    evSetStatus("","");
    evHide("ev-statusMsg");
    evShow("ev-eventSection");
    evRender();
  }

  function splitCSVRow(row){
    var cols=[], cur="", inQ=false;
    for(var i=0;i<row.length;i++){
      var c=row[i];
      if(c==='"'){ inQ=!inQ; }
      else if(c===','&&!inQ){ cols.push(cur); cur=""; }
      else { cur+=c; }
    }
    cols.push(cur);
    return cols;
  }

  function evEsc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

  var EV_LIMIT = 5;
  var evShowAll = false;

  function evGetToday(){
    var d = new Date();
    return EV_MONTHS.indexOf(['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()]) * 31 + d.getDate();
  }

  function evRender(){
    var list = document.getElementById("ev-eventList");
    if(!evEvents.length){list.innerHTML="<div class=\"ev-status\">No events found.</div>";return;}

    // Filter to upcoming events only
    var today = evGetToday();
    var upcoming = evEvents.filter(function(ev){
      return (EV_MONTHS.indexOf(ev.month)*31 + ev.day) >= today;
    });

    if(!upcoming.length){list.innerHTML="<div class=\"ev-status\">No upcoming events.</div>";return;}

    // Limit to 5 unless showing all
    var visible = evShowAll ? upcoming : upcoming.slice(0, EV_LIMIT);
    var hasMore = !evShowAll && upcoming.length > EV_LIMIT;

    list.innerHTML = visible.map(function(ev, i){
      var open = evOpenIdx === i;
      var dh = ev.detail ? "<p>"+ev.detail.replace(/\n/g,"<br>")+"</p>" : "<p><em>No additional details.</em></p>";
      var ih = ev.ics ? "<a class=\"ev-cal-link\" href=\""+evEsc(ev.ics)+"\" target=\"_blank\" rel=\"noopener\">Add to my calendar</a>" : "";
      return "<div role=\"listitem\"><div class=\"ev-row\" onclick=\"evToggle("+i+")\" role=\"button\" tabindex=\"0\" aria-expanded=\""+open+"\">"+
        "<div class=\"ev-badge\" aria-hidden=\"true\"><span class=\"ev-month\">"+evEsc(ev.month)+"</span><span class=\"ev-day\">"+ev.day+"</span></div>"+
        "<div class=\"ev-body\"><div class=\"ev-title\">"+evEsc(ev.title)+"</div><div class=\"ev-time\">"+evEsc(ev.time)+"</div>"+(ev.cat?"<div class=\"ev-cat\">"+evEsc(ev.cat)+"</div>":"")+"</div>"+
        "<div class=\"ev-arrow"+(open?" open":"")+"\" aria-hidden=\"true\"><svg class=\"ev-chevron\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 6l6 6-6 6\"/></svg></div></div>"+
        "<div class=\"ev-detail"+(open?"":" ev-hidden")+"\" role=\"region\">"+dh+ih+"</div></div>";
    }).join("");

    // View All / Show Less button
    if(hasMore){
      list.innerHTML += "<div class=\"ev-view-all-wrap\"><button class=\"ev-view-all-btn\" onclick=\"evToggleAll()\">View All "+upcoming.length+" Events</button></div>";
    } else if(evShowAll && upcoming.length > EV_LIMIT){
      list.innerHTML += "<div class=\"ev-view-all-wrap\"><button class=\"ev-view-all-btn\" onclick=\"evToggleAll()\">Show Less</button></div>";
    }
  }

  function evToggleAll(){ evShowAll = !evShowAll; evOpenIdx = -1; evRender(); }
  window.evToggleAll = evToggleAll;

  function evToggle(i){evOpenIdx=(evOpenIdx===i)?-1:i;evRender();}

  function evSetStatus(msg,isErr){
    var el=document.getElementById("ev-statusMsg");
    if(msg){el.className="ev-status"+(isErr?" err":"");el.textContent=msg;evShow("ev-statusMsg");}
    else{el.className="";el.textContent="";evHide("ev-statusMsg");}
  }

  window.evToggle=evToggle;

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",evInit);
  } else {
    evInit();
  }
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
