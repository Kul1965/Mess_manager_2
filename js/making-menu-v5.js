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
 const d=read(),date=$("attendanceDate").value,rows=Array.isArray(d.mealRecords)?d.mealRecords:[],members=Array.isArray(d.members)?d.members.filter(m=>String(m.status||"Active").toLowerCase()==="active"):[];
 $("dailyMealCards").innerHTML=meals.map(meal=>{
  const rs=recipesFor(date,meal),saved=rows.find(r=>r.date===date&&r.mealType===meal),names=rs.map(r=>r.name).join(" + "),choices=memberChoiceOptions(rs);
  if(saved)return '<article class="day-card" style="background:#103c2c"><h3>'+meal+' <span style="float:right;color:#8ee0a8">✓ Saved</span></h3><p class="mm-muted">'+esc((saved.recipeNames||[]).join(" + "))+' · '+(saved.memberIds||[]).length+' members · '+money(saved.totalCost)+'</p><p class="mm-muted">Khane wale: '+esc((saved.memberSnapshots||[]).map(x=>x.name).filter(Boolean).join(", ")||"Member names record mein available nahi")+'</p><div class="mm-actions"><button type="button" class="sendWA" data-id="'+esc(saved.id)+'">WhatsApp Ration</button></div></article>';
  if(!rs.length)return '<article class="day-card"><h3>'+meal+'</h3><p class="mm-muted">Is din ke menu mein recipe add nahi hai. Upar Weekly Menu mein is meal ke saamne recipe select karke ＋ Add karein.</p></article>';
  return '<article class="day-card" data-meal-card="'+esc(meal)+'"><h3>'+meal+'</h3><p class="mm-muted">Dishes: '+esc(names)+' · Neeche jin members ko khilana hai un par tick karein.</p><input class="mealMemberSearch" data-meal="'+esc(meal)+'" placeholder="Member search karein..." style="width:100%;margin:5px 0"><div class="mealMemberList">'+members.map(m=>{const pref=String(m.foodPreference||"Both"),def=choices.includes(pref)?pref:(choices.includes("Veg")?"Veg":"Non-Veg");return '<label class="mm-choice"><input type="checkbox" class="attMember" data-meal="'+esc(meal)+'" value="'+esc(m.id)+'"><span style="flex:1">'+esc(m.name||"")+' <small class="mm-muted">'+esc(m.forceNo||m.forceNumber||"")+'</small><select class="foodChoice" data-meal="'+esc(meal)+'" aria-label="Food choice" style="margin-top:6px;width:100%;max-width:190px">'+choices.map(t=>'<option value="'+t+'" '+(t===def?'selected':'')+'>'+t+'</option>').join("")+'</select></span></label>'}).join("")+'</div><p class="mm-muted" data-cost="'+esc(meal)+'">0 members selected · Total Rs 0.00</p><div class="mm-actions"><button type="button" class="mm-primary saveMeal" data-meal="'+esc(meal)+'">✓ Save '+meal+' Hajiri & Deduct Ration</button></div></article>'
 }).join("");
 renderRecords();
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
function saveMeal(meal){const d=read(),date=$("attendanceDate").value,card=document.querySelector('[data-meal-card="'+meal.replace(/"/g,'\\"')+'"]'),rows=selectedMemberRows(card),ids=rows.map(x=>x.id),rs=recipesFor(date,meal);if(!rs.length){notice("Menu Missing",meal+" ke liye pehle weekly menu mein recipe add karein.","error");return}if(!rows.length){notice("Members Select Karein",meal+" mein khane wale members par tick lagayein.","error");return}if((d.mealRecords||[]).some(r=>r.date===date&&r.mealType===meal)){notice("Already Saved","Is date aur meal ki hajiri pehle save ho chuki hai.","error");renderDailyCards();return}const valid=memberChoiceOptions(rs);if(rows.some(x=>!valid.includes(x.choice))){notice("Food Choice Missing","Har selected member ki Veg ya Non-Veg choice check karein.","error");return}const plans=rows.map(row=>{const dishes=recipesForChoice(rs,row.choice),ingredients=recipeIngredients(dishes,d);return {...row,dishes,ingredients,charge:memberMealCost(rs,row.choice)}});const grouped=new Map();plans.forEach(p=>p.ingredients.forEach(i=>{const key=String(i.itemId)+"|"+i.unit,old=grouped.get(key)||{...i,recipeQuantity:0};old.recipeQuantity+=Number(i.per||0);grouped.set(key,old)}));const usage=[];for(const i of grouped.values()){const item=(d.ration||[]).find(x=>String(x.id)===String(i.itemId));if(!item){notice("Store Item Missing",i.itemName+" Ration Store mein nahi mila.","error");return}const q=convert(i.recipeQuantity,i.unit,item.unit);if(q===null||Number(item.quantity||0)+1e-9<q){notice("Stock Kam Hai",item.name+" ka stock kam hai. Required: "+i.recipeQuantity+" "+i.unit,"error");return}usage.push({...i,recipeUnit:i.unit,unit:item.unit,quantity:q})}if(!usage.length){notice("Ingredients Missing","Selected Veg/Non-Veg recipes ke ingredients check karein.","error");return}const totalCost=plans.reduce((s,p)=>s+p.charge,0),avg=totalCost/rows.length;if(!confirm(date+" "+meal+": "+rows.length+" members ki alag choice save karke ration deduct karein? Total "+money(totalCost)))return;usage.forEach(u=>{const item=d.ration.find(x=>String(x.id)===String(u.itemId));item.quantity=Number(item.quantity||0)-u.quantity});d.mealRecords=d.mealRecords||[];const memberSnapshots=plans.map(p=>{const m=(d.members||[]).find(x=>String(x.id)===String(p.id));return{id:String(p.id),name:m?.name||"",forceNo:m?.forceNo||m?.forceNumber||"",foodChoice:p.choice,dishes:p.dishes.map(x=>x.name),charge:p.charge,perServingIngredients:p.ingredients.map(i=>({itemId:i.itemId,itemName:i.itemName,quantity:i.per,unit:i.unit}))}});const recipeSnapshots=rs.map(x=>({id:String(x.id),name:x.name,foodType:recipeType(x),costPerServing:Number(x.costPerServing||0),ingredients:(x.ingredients||[]).map(i=>({itemId:i.itemId,itemName:i.itemName||"",quantity:Number(i.quantity||0),unit:i.unit||""}))}));const rec={id:"MEAL"+Date.now(),date,mealType:meal,recipeIds:rs.map(x=>x.id),recipeNames:rs.map(x=>x.name),recipeSnapshots,memberIds:ids,memberSnapshots,foodType:mealFoodType(rs),chargePerMember:avg,totalCost,ingredientUsage:usage,perServingIngredients:[],cookWhatsAppSent:false,createdAt:new Date().toISOString()};d.mealRecords.push(rec);d.stockMovements=d.stockMovements||[];usage.forEach(u=>d.stockMovements.push({id:"OUT"+Date.now()+Math.random().toString(16).slice(2),date,type:"meal-consumption",itemId:u.itemId,itemName:u.itemName,quantity:u.quantity,unit:u.unit,reference:meal+" - "+rs.map(x=>x.name).join(" + "),memberCount:ids.length}));if(!write(d))return;notice("Hajiri Saved",meal+" ki alag choice, bill aur ration deduction save ho gaya.","success");renderDailyCards()}
function sendCook(id){const d=read(),r=(d.mealRecords||[]).find(x=>String(x.id)===String(id));if(!r)return;const s=(d.staff||[]).find(x=>String(x.id)===$("cookSelect").value),phone=String(s?.phone||s?.mobile||s?.contact||"").replace(/\D/g,"");if(!phone){notice("Cook Number Missing","Mess Staff mein Cook ka country-code mobile number add karein.","error");return}const key=r.date+"|"+r.mealType;d.cookRationSent=d.cookRationSent||{};if(d.cookRationSent[key]){notice("Already Sent","Is date aur meal ka WhatsApp pehle hi bheja gaya hai.","error");return}const lines=(r.ingredientUsage||[]).map(i=>i.itemName+": "+i.recipeQuantity+" "+i.recipeUnit),msg=["CRPF MESS RATION",r.date,r.mealType,"Dishes: "+(r.recipeNames||[]).join(" + "),"Members: "+(r.memberIds||[]).length,"Ration:",...lines].join("\n"),url="https://wa.me/"+phone+"?text="+encodeURIComponent(msg);const win=window.open(url,"_blank");if(!win){window.location.href=url;return}d.cookRationSent[key]={sentAt:new Date().toISOString(),recordId:r.id};r.cookWhatsAppSent=true;if(write(d)){notice("WhatsApp Ready","WhatsApp khul gaya hai. Ab Send dabayein. Is meal ka message dobara nahi bheja jayega.","success");renderRecords()}}
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
$("attendanceDate").value=$("attendanceDate").value||today();$("dateNow").textContent=new Date().toLocaleDateString();$("attendanceDate").addEventListener("change",renderDailyCards);$("dailyMealCards").addEventListener("change",e=>{if(e.target.matches(".attMember")||e.target.matches(".foodChoice"))updateMealCost(e.target.dataset.meal||e.target.closest("[data-meal-card]")?.dataset.mealCard)});$("dailyMealCards").addEventListener("input",e=>{if(e.target.matches(".mealMemberSearch")){const card=e.target.closest("[data-meal-card]"),q=e.target.value.toLowerCase();card.querySelectorAll(".mm-choice").forEach(row=>row.style.display=row.textContent.toLowerCase().includes(q)?"flex":"none")}});$("dailyMealCards").addEventListener("click",e=>{const b=e.target.closest(".saveMeal"),w=e.target.closest(".sendWA");if(b)saveMeal(b.dataset.meal);if(w)sendCook(w.dataset.id)});$("cookSelect").addEventListener("change",syncCook);$("todayRecords").addEventListener("click",e=>{const b=e.target.closest(".sendWA");if(b)sendCook(b.dataset.id)});renderWeek();renderCook();renderDailyCards();
})();
