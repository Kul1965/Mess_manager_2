/* CRPF Mess: seven-day recipe dropdown planner + daily attendance */
(function(){"use strict";
const KEY="crpfMessData",$=id=>document.getElementById(id),read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return {}}},write=d=>{try{localStorage.setItem(KEY,JSON.stringify(d));return true}catch(e){notice("Save Failed","Browser storage full hai. Backup lekar storage check karein.","error");return false}},esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),money=v=>"Rs "+Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}),days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],meals=["Morning Tea","Breakfast","Midday Tea","Lunch","Evening Tea","Dinner"];
function notice(t,m,k){const w=document.createElement("div");w.className="mm-notice";const b=document.createElement("div");b.className="mm-notice-box";b.innerHTML='<div style="font-size:34px">'+(k==="error"?"⚠️":"✅")+'</div><h3></h3><p></p><button type="button">Theek hai</button>';b.querySelector("h3").textContent=t;b.querySelector("p").textContent=m;b.querySelector("button").onclick=()=>w.remove();w.appendChild(b);document.body.appendChild(w)}
function today(){const d=new Date();return[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
function recipes(){return read().recipes||[]}function unitInfo(u){u=String(u||"").toLowerCase();if(["g","gram","grams"].includes(u))return["w",1];if(["kg","kgs"].includes(u))return["w",1000];if(u==="ml")return["v",1];if(["l","ltr","litre","liter"].includes(u))return["v",1000];if(["pcs","pc","piece","pieces"].includes(u))return["c",1];return null}function convert(q,a,b){const x=unitInfo(a),y=unitInfo(b);return!x||!y||x[0]!==y[0]?null:Number(q)*x[1]/y[1]}function baseUnit(i){const u=String(i?.unit||"").toLowerCase();return["kg","kgs","g","gram","grams"].includes(u)?"g":["ltr","l","litre","liter","ml"].includes(u)?"ml":"pcs"}
function renderWeek(){
 const d=read(),tpl=d.weeklyTemplate&&typeof d.weeklyTemplate==="object"?d.weeklyTemplate:{},list=Array.isArray(d.recipes)?d.recipes:[];
 $("allDaysMenu").innerHTML=days.map((day,di)=>{
  const dayData=tpl[String(di)]&&typeof tpl[String(di)]==="object"?tpl[String(di)]:{};
  return '<div class="day-card"><h3>'+day+'</h3>'+meals.map(meal=>{
   const ids=Array.isArray(dayData[meal])?dayData[meal].map(String):[];
   return '<div class="slot"><b>'+meal+'</b><select class="recipePick" data-day="'+di+'" data-meal="'+meal+'"><option value="">'+(list.length?'Recipe select karein':'Pehle Recipes page par recipe banayein')+'</option>'+list.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.name||"Unnamed Recipe")+' · '+esc(r.foodType||"Both")+'</option>').join("")+'</select><button type="button" class="addRecipe" data-day="'+di+'" data-meal="'+meal+'" '+(!list.length?'disabled':'')+'>＋ Add</button><div class="picked" id="picked-'+di+'-'+meals.indexOf(meal)+'">'+ids.map(id=>{const r=list.find(x=>String(x.id)===id);return r?'<span>'+esc(r.name)+' ('+esc(r.foodType||"Both")+') <button type="button" class="removeRecipe" data-day="'+di+'" data-meal="'+meal+'" data-id="'+esc(id)+'">×</button></span>':""}).join("")+'</div></div>'
  }).join("")+'</div>'
 }).join("");
 $("weekStatus").textContent=list.length?"Sunday se Saturday tak har meal mein recipe select karke Add dabayein. Phir Save Complete Weekly Menu karein.":"Recipe nahi mili. Pehle Recipes page par recipe banayein; uske baad yahan dropdown mein dikhegi.";
}
function getSelected(){const d=read(),out=JSON.parse(JSON.stringify(d.weeklyTemplate||{}));days.forEach((_,di)=>{out[String(di)]=out[String(di)]||{};meals.forEach(m=>out[String(di)][m]=Array.isArray(out[String(di)][m])?out[String(di)][m]:[])});return out}
function addRecipe(day,meal){const s=document.querySelector('.recipePick[data-day="'+day+'"][data-meal="'+meal+'"]'),id=s.value;if(!id){notice("Recipe Select Karein","Dropdown se recipe choose karein, phir Add dabayein.","error");return}const t=getSelected();t[String(day)][meal]=t[String(day)][meal].map(String);if(!t[String(day)][meal].includes(String(id)))t[String(day)][meal].push(String(id));const d=read();d.weeklyTemplate=t;if(!write(d))return;renderWeek()}
function saveWeek(){const d=read(),t=d.weeklyTemplate||{};days.forEach((_,di)=>{t[String(di)]=t[String(di)]||{};meals.forEach(m=>t[String(di)][m]=Array.isArray(t[String(di)][m])?t[String(di)][m]:[])});d.weeklyTemplate=t;if(write(d))notice("Poore Hafte ka Menu Save","Sunday se Saturday tak ka menu save ho gaya. Ab har hafte yahi repeat hoga jab tak aap change nahi karte.","success")}
function selectedRecipeIds(date,meal){return(((read().weeklyTemplate||{})[String(new Date(date+"T12:00:00").getDay())]||{})[meal]||[]).map(String)}
function recipesFor(date,meal){const ids=(((read().weeklyTemplate||{})[String(new Date(date+"T12:00:00").getDay())]||{})[meal]||[]).map(String);return recipes().filter(r=>ids.includes(String(r.id)))}
function activeMembers(){return(read().members||[]).filter(m=>String(m.status||"Active").toLowerCase()==="active")}
function mealFoodType(selected){const types=[...new Set((selected||[]).map(r=>String(r.foodType||"Both")))];return types.length===1?types[0]:(types.length?"Mixed":"Both")}
function eligibleMembers(all,selected){return all}
function recipeType(r){const t=String(r.foodType||"Both");return ["Veg","Non-Veg"].includes(t)?t:"Both"}
function recipesForChoice(selected,choice){return (selected||[]).filter(r=>recipeType(r)==="Both"||recipeType(r)===choice)}
function memberChoiceOptions(selected){const types=new Set((selected||[]).map(recipeType));return ["Veg","Non-Veg"].filter(t=>types.has(t)||types.has("Both"))}
function memberMealCost(selected,choice){return recipesForChoice(selected,choice).reduce((s,r)=>s+Number(r.costPerServing||0),0)}
function selectedMemberRows(card){return card?[...card.querySelectorAll(".attMember:checked")].map(box=>{const row=box.closest(".mm-choice"),choice=row?.querySelector(".foodChoice")?.value||"Veg";return{id:String(box.value),choice}}):[]}
function renderDailyCards(){
 const d=read(),date=$("attendanceDate").value,rows=(d.mealRecords||[]).filter(r=>r.date===date),members=activeMembers();
 $("dailyMealCards").innerHTML=meals.map(meal=>{
  const rs=recipesFor(date,meal),saved=rows.find(r=>r.mealType===meal);
  if(saved){
   const dishLines=(saved.dishAttendance||[]).map(x=>x.recipeName+" — "+(x.memberNames||[]).join(", ")).join(" | ");
   return '<article class="day-card"><h3>'+esc(meal)+' <span style="float:right;color:#8ee0a8">✓ Saved</span></h3><p class="mm-muted">Dishes: '+esc((saved.recipeNames||[]).join(" + "))+'</p><p class="mm-muted">Members: '+esc((saved.memberSnapshots||[]).map(x=>x.name).join(", ")||((saved.memberIds||[]).length+" members"))+'</p><p class="mm-muted">Total: '+money(saved.totalCost)+'</p><p class="mm-muted">'+esc(dishLines)+'</p><div class="mm-actions"><button type="button" class="sendWA" data-id="'+esc(saved.id)+'">WhatsApp Ration</button></div></article>';
  }
  if(!rs.length)return '<article class="day-card"><h3>'+esc(meal)+'</h3><p class="mm-muted">Is din ke menu mein recipe nahi hai. Upar Weekly Menu mein dish add karein.</p></article>';
  const dishHtml=rs.map(r=>{
   const type=String(r.foodType||"Both"),eligible=members.filter(m=>{const p=String(m.foodPreference||"Both");return type==="Both"||p==="Both"||p===type;});
   const blocked=members.length-eligible.length;
   return '<section class="dish-attendance" data-dish="'+esc(r.id)+'" style="border:1px solid var(--border);border-radius:10px;padding:10px;margin:10px 0"><h4>'+esc(r.name)+' <small>('+esc(type)+')</small></h4><p class="mm-muted">Cost / serving: '+money(r.costPerServing||r.totalCost||0)+' · Eligible members: '+eligible.length+'</p><div class="mm-actions"><button type="button" class="selectDishMembers" data-meal="'+esc(meal)+'" data-recipe="'+esc(r.id)+'">Select all eligible</button><button type="button" class="clearDishMembers" data-meal="'+esc(meal)+'" data-recipe="'+esc(r.id)+'">Clear</button></div><div class="mealMemberList">'+eligible.map(m=>'<label class="mm-choice"><input type="checkbox" class="dishMember" data-meal="'+esc(meal)+'" data-recipe="'+esc(r.id)+'" value="'+esc(m.id)+'"><span>'+esc(m.name||"")+' <small class="mm-muted">'+esc(m.forceNo||m.forceNumber||"")+' · '+esc(m.foodPreference||"Both")+'</small></span></label>').join("")+'</div>'+(blocked?'<p class="mm-muted">'+blocked+' members hidden due to Veg/Non-Veg preference.</p>':"")+'</section>';
  }).join("");
  return '<article class="day-card" data-meal-card="'+esc(meal)+'"><h3>'+esc(meal)+'</h3><p class="mm-muted">Har dish ke saamne sirf un members ko tick karein jo woh dish khayenge. Veg/Non-Veg preference automatic follow hogi.</p><input class="mealMemberSearch" data-meal="'+esc(meal)+'" placeholder="Member search karein..." style="width:100%;margin:5px 0">'+dishHtml+'<p class="mm-muted" data-cost="'+esc(meal)+'">0 members selected · Total Rs 0.00</p><div class="mm-actions"><button type="button" class="mm-primary saveMeal" data-meal="'+esc(meal)+'">✓ Save '+esc(meal)+' Hajiri & Deduct Ration</button></div></article>';
 }).join("");
 renderRecords();
}
function updateMealCost(meal){
 const card=document.querySelector('[data-meal-card="'+meal.replace(/"/g,'\\\"')+'"]');if(!card)return;
 const rs=recipesFor($("attendanceDate").value,meal),ids=new Set();let total=0,servings=0;
 rs.forEach(r=>{
  const selected=[...card.querySelectorAll('.dishMember[data-recipe="'+String(r.id).replace(/"/g,'\\\"')+'"]:checked')];
  servings+=selected.length;total+=Number(r.costPerServing||r.totalCost||0)*selected.length;selected.forEach(x=>ids.add(String(x.value)));
 });
 const el=card.querySelector("[data-cost]");if(el)el.textContent=ids.size+" unique members selected · "+servings+" dish servings · Total "+money(total);
}
function renderCook(){
 const d=read(),s=$("cookSelect"),staff=Array.isArray(d.staff)?d.staff:[],list=staff.filter(x=>String(x.status||"Active").toLowerCase()==="active"&&String(x.duty||"").toLowerCase()==="cook"),old=s.value;
 s.innerHTML='<option value="">Cook select karein</option>'+list.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name||"Cook")+'</option>').join("");
 if(list.some(x=>String(x.id)===old))s.value=old;else if(list.length)s.value=list[0].id;
 syncCook();
}
function syncCook(){const s=(read().staff||[]).find(x=>String(x.id)===$("cookSelect").value);$("cookPhone").value=s?String(s.phone||s.mobile||s.contact||"").replace(/\D/g,""):""}
function renderRecords(){
 const d=read(),date=$("attendanceDate").value,rows=(Array.isArray(d.mealRecords)?d.mealRecords:[]).slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))||String(a.mealType||"").localeCompare(String(b.mealType||"")));
 $("todayRecords").innerHTML=rows.map(r=>{
  const names=(r.memberSnapshots||[]).map(x=>x.name).filter(Boolean),memberText=names.length?names.join(", "):(r.memberIds||[]).length+" members";
  return '<tr><td>'+esc(r.date)+'</td><td>'+esc(r.mealType)+'</td><td>'+esc((r.recipeNames||[r.recipeName||""]).join(" + "))+'</td><td><b>'+(r.memberIds||[]).length+'</b><br><small>'+esc(memberText)+'</small></td><td>'+money(r.totalCost)+'</td><td>'+(r.cookWhatsAppSent?"✓ Sent":'<button type="button" class="sendWA" data-id="'+esc(r.id)+'">WhatsApp</button>')+'</td></tr>'
 }).join("")||'<tr><td colspan="6" style="text-align:center">Abhi koi meal save nahi hua.</td></tr>';
 const status=$("weekStatus");
 if(status&&rows.length)status.textContent="Saved records: "+rows.length+" meals. Neeche saved meal ke saath member names aur kharcha dekhein.";
}
function recipeIngredients(selectedRecipes,data){
 const grouped=new Map();
 (selectedRecipes||[]).forEach(recipe=>{
  (recipe.ingredients||[]).forEach(ingredient=>{
   const itemId=String(ingredient.itemId||"");
   const item=(data.ration||[]).find(x=>String(x.id)===itemId);
   const unit=String(ingredient.unit||item?.unit||"");
   const quantity=Number(ingredient.quantity||0);
   if(!itemId||!unit||!Number.isFinite(quantity)||quantity<=0)return;
   const key=itemId+"|"+unit;
   const current=grouped.get(key)||{itemId,itemName:ingredient.itemName||item?.name||"Ration item",per:0,unit};
   current.per+=quantity;
   grouped.set(key,current);
  });
 });
 return [...grouped.values()];
}
function saveMeal(meal){
 const d=read(),date=$("attendanceDate").value,card=document.querySelector('[data-meal-card="'+meal.replace(/"/g,'\\\"')+'"]'),rs=recipesFor(date,meal);
 if(!date){notice("Date Select Karein","Hajiri ki date select karein.","error");return}
 if(!rs.length){notice("Menu Missing",meal+" ke liye weekly menu mein dish add karein.","error");return}
 if(!card){notice("Already Saved","Is meal ki hajiri pehle save ho chuki hai.","error");return}
 if((d.mealRecords||[]).some(r=>r.date===date&&r.mealType===meal)){notice("Already Saved","Is date aur meal ki hajiri pehle save ho chuki hai.","error");renderDailyCards();return}
 const dishAttendance=[],allIds=new Set(),usage=[],memberCharge={};let totalCost=0;
 const members=activeMembers();
 for(const recipe of rs){
  const boxes=[...card.querySelectorAll('.dishMember[data-recipe="'+String(recipe.id).replace(/"/g,'\\\"')+'"]:checked')],ids=[...new Set(boxes.map(x=>String(x.value)))];
  if(!ids.length){notice("Dish Hajiri Missing",recipe.name+" ke liye kam se kam ek member select karein.","error");return}
  const type=String(recipe.foodType||"Both"),invalid=ids.filter(id=>{const m=members.find(x=>String(x.id)===id),p=String(m?.foodPreference||"Both");return m&&type!=="Both"&&p!=="Both"&&p!==type});
  if(invalid.length){notice("Food Preference Mismatch",recipe.name+" mein Veg/Non-Veg preference match nahi karti.","error");return}
  const per=Number(recipe.costPerServing||recipe.totalCost||0);ids.forEach(id=>{allIds.add(id);memberCharge[id]=(memberCharge[id]||0)+per});totalCost+=per*ids.length;
  const ingredients=recipeIngredients([recipe],d);if(!ingredients.length){notice("Ingredients Missing",recipe.name+" mein ration ingredients nahi mile. Recipe page par check karein.","error");return}
  for(const ing of ingredients){
   const item=(d.ration||[]).find(x=>String(x.id)===String(ing.itemId));if(!item){notice("Store Item Missing",ing.itemName+" Ration Store mein nahi mila.","error");return}
   const need=convert(ing.per*ids.length,ing.unit,item.unit);if(need===null){notice("Unit Mismatch",item.name+" ki recipe aur store unit match nahi kar rahi.","error");return}
   const prior=usage.find(x=>String(x.itemId)===String(ing.itemId)&&x.unit===item.unit);
   if(prior){prior.quantity+=need;prior.recipeQuantity+=ing.per*ids.length;prior.recipeNames.push(recipe.name)}
   else usage.push({itemId:ing.itemId,itemName:item.name||ing.itemName,quantity:need,unit:item.unit,recipeQuantity:ing.per*ids.length,recipeUnit:ing.unit,recipeNames:[recipe.name]});
  }
  dishAttendance.push({recipeId:recipe.id,recipeName:recipe.name,foodType:type,memberIds:ids,memberNames:ids.map(id=>(members.find(m=>String(m.id)===id)||{}).name||id),servings:ids.length,costPerServing:per,totalCost:per*ids.length});
 }
 const memberIds=[...allIds];if(!memberIds.length){notice("Members Select Karein","Har dish ke saamne khane wale members tick karein.","error");return}
 for(const u of usage){const item=(d.ration||[]).find(x=>String(x.id)===String(u.itemId));if(!item||Number(item.quantity||0)+1e-9<u.quantity){notice("Stock Kam Hai",(item?.name||u.itemName)+" ka stock kam hai. Required: "+u.quantity+" "+u.unit,"error");return}}
 if(!confirm(date+" "+meal+": "+dishAttendance.length+" dishes, "+memberIds.length+" unique members. Har dish ki alag hajiri aur ration deduction save karein?"))return;
 usage.forEach(u=>{const item=d.ration.find(x=>String(x.id)===String(u.itemId));item.quantity=Number(item.quantity||0)-u.quantity});
 d.mealRecords=d.mealRecords||[];
 const rec={id:"MEAL"+Date.now(),date,mealType:meal,recipeIds:rs.map(x=>x.id),recipeNames:rs.map(x=>x.name),memberIds,memberSnapshots:memberIds.map(id=>{const m=members.find(x=>String(x.id)===id)||{};return{id,name:m.name||id,foodPreference:m.foodPreference||"Both"}}),dishAttendance,memberCharge,totalCost,ingredientUsage:usage,cookWhatsAppSent:false,createdAt:new Date().toISOString()};
 d.mealRecords.push(rec);d.stockMovements=d.stockMovements||[];
 usage.forEach(u=>d.stockMovements.push({id:"OUT"+Date.now()+Math.random().toString(16).slice(2),date,type:"meal-consumption",itemId:u.itemId,itemName:u.itemName,quantity:u.quantity,unit:u.unit,reference:meal+" - "+rs.map(x=>x.name).join(" + "),memberCount:memberIds.length}));
 if(!write(d))return;notice("Hajiri Saved",meal+" ki dish-wise hajiri save hui. "+memberIds.length+" members, total "+money(totalCost)+", ration stock deduct hua.","success");renderDailyCards();
}
function sendCook(id){const d=read(),r=(d.mealRecords||[]).find(x=>String(x.id)===String(id));if(!r)return;const s=(d.staff||[]).find(x=>String(x.id)===$("cookSelect").value),phone=String(s?.phone||s?.mobile||s?.contact||"").replace(/\D/g,"");if(!phone){notice("Cook Number Missing","Mess Staff mein Cook ka country-code mobile number add karein.","error");return}const key=r.date+"|"+r.mealType;d.cookRationSent=d.cookRationSent||{};if(d.cookRationSent[key]){notice("Already Sent","Is date aur meal ka WhatsApp pehle hi bheja gaya hai.","error");return}const lines=(r.ingredientUsage||[]).map(i=>i.itemName+": "+i.quantity+" "+i.unit),dishLines=(r.dishAttendance||[]).map(x=>x.recipeName+" ("+x.foodType+"): "+x.servings+" members — "+(x.memberNames||[]).join(", ")),msg=["CRPF MESS RATION",r.date,r.mealType,"Dishes:",...dishLines,"Total unique members: "+(r.memberIds||[]).length,"Ration:",...lines].join("\n"),url="https://wa.me/"+phone+"?text="+encodeURIComponent(msg);const win=window.open(url,"_blank");if(!win){window.location.href=url;return}d.cookRationSent[key]={sentAt:new Date().toISOString(),recordId:r.id};r.cookWhatsAppSent=true;if(write(d)){notice("WhatsApp Ready","WhatsApp khul gaya hai. Ab Send dabayein. Is meal ka message dobara nahi bheja jayega.","success");renderRecords()}}
// Weekly menu controls: delegated handlers keep Add working after the menu is re-rendered.
$("allDaysMenu").addEventListener("click",e=>{
 const add=e.target.closest(".addRecipe");
 if(add){addRecipe(add.dataset.day,add.dataset.meal);return}
 const remove=e.target.closest(".removeRecipe");
 if(remove){
  const t=getSelected(),day=String(remove.dataset.day),meal=remove.dataset.meal,id=String(remove.dataset.id);
  t[day][meal]=t[day][meal].map(String).filter(x=>x!==id);
  const d=read();d.weeklyTemplate=t;
  if(write(d))renderWeek();
 }
});
$("saveWholeWeek").addEventListener("click",saveWeek);
$("attendanceDate").value=$("attendanceDate").value||today();$("dateNow").textContent=new Date().toLocaleDateString();$("attendanceDate").addEventListener("change",renderDailyCards);$("dailyMealCards").addEventListener("change",e=>{if(e.target.matches(".attMember")||e.target.matches(".foodChoice"))updateMealCost(e.target.dataset.meal||e.target.closest("[data-meal-card]")?.dataset.mealCard)});$("dailyMealCards").addEventListener("input",e=>{if(e.target.matches(".mealMemberSearch")){const card=e.target.closest("[data-meal-card]"),q=e.target.value.toLowerCase();card.querySelectorAll(".mm-choice").forEach(row=>row.style.display=row.textContent.toLowerCase().includes(q)?"flex":"none")}});$("dailyMealCards").addEventListener("click",e=>{const b=e.target.closest(".saveMeal"),w=e.target.closest(".sendWA"),all=e.target.closest(".selectDishMembers"),none=e.target.closest(".clearDishMembers");if(b)saveMeal(b.dataset.meal);if(w)sendCook(w.dataset.id);if(all||none){const btn=all||none,card=btn.closest("[data-meal-card]");card.querySelectorAll(".dishMember[data-recipe=\""+btn.dataset.recipe+"\"]").forEach(x=>x.checked=!!all);updateMealCost(btn.dataset.meal)}});$("cookSelect").addEventListener("change",syncCook);$("todayRecords").addEventListener("click",e=>{const b=e.target.closest(".sendWA");if(b)sendCook(b.dataset.id)});renderWeek();renderCook();renderDailyCards();
})();
