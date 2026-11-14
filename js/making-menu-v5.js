/* CRPF Mess: seven-day recipe dropdown planner + daily attendance */
(function(){"use strict";
const KEY="crpfMessData",$=id=>document.getElementById(id),read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return {}}},write=d=>{try{localStorage.setItem(KEY,JSON.stringify(d));return true}catch(e){notice("Save Failed","Browser storage full hai. Backup lekar storage check karein.","error");return false}},esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),money=v=>"Rs "+Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}),days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],meals=["Morning Tea","Breakfast","Midday Tea","Lunch","Evening Tea","Dinner"];
function notice(t,m,k){const w=document.createElement("div");w.className="mm-notice";const b=document.createElement("div");b.className="mm-notice-box";b.innerHTML='<div style="font-size:34px">'+(k==="error"?"⚠️":"✅")+'</div><h3></h3><p></p><button type="button">Theek hai</button>';b.querySelector("h3").textContent=t;b.querySelector("p").textContent=m;b.querySelector("button").onclick=()=>w.remove();w.appendChild(b);document.body.appendChild(w)}
function today(){const d=new Date();return[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
function recipes(){return read().recipes||[]}function unitInfo(u){u=String(u||"").toLowerCase();if(["g","gram","grams"].includes(u))return["w",1];if(["kg","kgs"].includes(u))return["w",1000];if(u==="ml")return["v",1];if(["l","ltr","litre","liter"].includes(u))return["v",1000];if(["pcs","pc","piece","pieces"].includes(u))return["c",1];return null}function convert(q,a,b){const x=unitInfo(a),y=unitInfo(b);return!x||!y||x[0]!==y[0]?null:Number(q)*x[1]/y[1]}function baseUnit(i){const u=String(i?.unit||"").toLowerCase();return["kg","kgs","g","gram","grams"].includes(u)?"g":["ltr","l","litre","liter","ml"].includes(u)?"ml":"pcs"}
let entryRecipeIds=[],entryMembers=[];
function currentRecipes(){return Array.isArray(read().recipes)?read().recipes:[]}
function renderRecipeOptions(){const s=$("recipeSelect"),list=currentRecipes(),old=s.value;s.innerHTML='<option value="">Recipe select karein</option>'+list.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.name||"Recipe")+' · '+esc(recipeType(r))+'</option>').join("");if(list.some(r=>String(r.id)===old))s.value=old}
function renderMemberOptions(){const s=$("memberSelect"),list=activeMembers(),old=s.value;s.innerHTML='<option value="">Member select karein</option>'+list.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name||"Member")+(m.forceNo?" · ID "+esc(m.forceNo):"")+'</option>').join("");if(list.some(m=>String(m.id)===old))s.value=old}
function renderEntryLists(){
 const d=read(),recipes=currentRecipes(),members=activeMembers();
 $("selectedRecipes").innerHTML=entryRecipeIds.length?entryRecipeIds.map(id=>{const r=recipes.find(x=>String(x.id)===String(id));return r?'<span>'+esc(r.name)+' · '+esc(recipeType(r))+' <button type="button" class="removeEntryRecipe" data-id="'+esc(id)+'">×</button></span>':""}).join(""):'<span>Abhi recipe add nahi hui</span>';
 $("selectedMembers").innerHTML=entryMembers.length?entryMembers.map(x=>{const m=members.find(y=>String(y.id)===String(x.id));return m?'<div class="mm-choice" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b style="flex:1">'+esc(m.name||"Member")+'</b><small>'+esc(m.forceNo||m.forceNumber||"")+'</small><select class="entryFoodChoice" data-id="'+esc(m.id)+'" style="max-width:130px"><option value="Veg" '+(x.choice==="Veg"?"selected":"")+'>Veg</option><option value="Non-Veg" '+(x.choice==="Non-Veg"?"selected":"")+'>Non-Veg</option></select><button type="button" class="removeEntryMember" data-id="'+esc(m.id)+'">Remove</button></div>':""}).join(""):'<p class="mm-muted">Abhi member add nahi hua.</p>';
 updateEntrySummary();
}
function updateEntrySummary(){
 const recipes=currentRecipes().filter(r=>entryRecipeIds.includes(String(r.id))),members=activeMembers();
 let total=0,veg=0,nonveg=0,missing=[];
 entryMembers.forEach(x=>{const m=members.find(y=>String(y.id)===String(x.id)),chosen=recipesForChoice(recipes,x.choice);if(x.choice==="Veg")veg++;else nonveg++;if(!chosen.length)missing.push((m?.name||"Member")+" ke liye "+x.choice+" recipe nahi hai");total+=chosen.reduce((sum,r)=>sum+Number(r.costPerServing||r.totalCost||0),0)});
 $("entrySummary").innerHTML='<b>Recipes:</b> '+recipes.length+' · <b>Members:</b> '+entryMembers.length+' (Veg '+veg+' / Non-Veg '+nonveg+') · <b>Estimated total:</b> '+money(total)+(missing.length?'<p style="color:#a83232">'+esc(missing.join("; "))+'</p>':"");
}
function addEntryRecipe(){const id=$("recipeSelect").value;if(!id){notice("Recipe Select Karein","Recipe dropdown se recipe chunein.","error");return}if(!entryRecipeIds.includes(String(id)))entryRecipeIds.push(String(id));$("recipeSelect").value="";renderEntryLists()}
function addEntryMember(){const id=$("memberSelect").value;if(!id){notice("Member Select Karein","Member dropdown se naam chunein.","error");return}if(entryMembers.some(x=>String(x.id)===String(id))){notice("Already Added","Yeh member list mein pehle se hai.","error");return}const m=activeMembers().find(x=>String(x.id)===String(id));entryMembers.push({id:String(id),choice:String(m?.foodPreference||"Veg")==="Non-Veg"?"Non-Veg":"Veg"});$("memberSelect").value="";renderEntryLists()}
function saveEntry(){
 const d=read(),date=$("entryDate").value,day=$("entryDay").value,meal=$("entryMeal").value,allRecipes=currentRecipes(),selected=allRecipes.filter(r=>entryRecipeIds.includes(String(r.id))),members=activeMembers();
 if(!date){notice("Date Required","Meal ki date chunein.","error");return}
 if(!selected.length){notice("Recipe Required","Recipe dropdown se ek ya zyada recipes Add karein.","error");return}
 if(!entryMembers.length){notice("Members Required","Member dropdown se khana khane wale members Add karein.","error");return}
 const snapshots=[],usageMap=new Map();let totalCost=0;
 for(const entry of entryMembers){
  const m=members.find(x=>String(x.id)===String(entry.id));if(!m){notice("Member Missing","Selected member ab active list mein nahi hai.","error");return}
  const dishes=recipesForChoice(selected,entry.choice);
  if(!dishes.length){notice("Recipe Choice Missing",m.name+" ke liye "+entry.choice+" recipe add karein.","error");return}
  const charge=dishes.reduce((sum,r)=>sum+Number(r.costPerServing||r.totalCost||0),0);
  totalCost+=charge;
  const ingredients=recipeIngredients(dishes,d);
  if(!ingredients.length){notice("Recipe Ingredients Missing",m.name+" ki selected "+entry.choice+" recipes mein ration ingredients nahi mile.","error");return}
  ingredients.forEach(i=>{const key=String(i.itemId)+"|"+i.unit,old=usageMap.get(key)||{...i,per:0,recipeNames:[]};old.per+=Number(i.per||0);old.recipeNames.push(...dishes.map(r=>r.name));usageMap.set(key,old)});
  snapshots.push({id:String(m.id),name:m.name||"",forceNo:m.forceNo||m.forceNumber||"",rank:m.rank||"",foodChoice:entry.choice,dishes:dishes.map(r=>r.name),charge,ingredients:ingredients.map(i=>({itemId:i.itemId,itemName:i.itemName,quantity:i.per,unit:i.unit}))});
 }
 const usage=[];
 for(const x of usageMap.values()){
  const item=(d.ration||[]).find(y=>String(y.id)===String(x.itemId));if(!item){notice("Store Item Missing",x.itemName+" Ration Store mein nahi mila.","error");return}
  const quantity=convert(x.per,x.unit,item.unit);if(quantity===null){notice("Unit Mismatch",x.itemName+" ki recipe aur store unit match nahi kar rahi.","error");return}
  if(Number(item.quantity||0)+1e-9<quantity){notice("Stock Kam Hai",x.itemName+" ka stock kam hai. Required "+quantity+" "+item.unit,"error");return}
  usage.push({itemId:x.itemId,itemName:item.name||x.itemName,recipeQuantity:x.per,recipeUnit:x.unit,quantity,unit:item.unit,recipeNames:[...new Set(x.recipeNames)]});
 }
 if(!confirm(date+" ("+day+") · "+meal+"\n"+selected.length+" recipes · "+snapshots.length+" members\nTotal "+money(totalCost)+"\n\nSave aur ration stock deduct karein?"))return;
 usage.forEach(x=>{const item=d.ration.find(y=>String(y.id)===String(x.itemId));item.quantity=Number(item.quantity||0)-x.quantity});
 d.mealRecords=Array.isArray(d.mealRecords)?d.mealRecords:[];
 const rec={id:"MEAL"+Date.now(),date,day,mealType:meal,recipeIds:selected.map(x=>x.id),recipeNames:selected.map(x=>x.name),memberIds:snapshots.map(x=>x.id),memberSnapshots:snapshots,totalCost,ingredientUsage:usage,cookWhatsAppSent:false,createdAt:new Date().toISOString()};
 d.mealRecords.push(rec);d.stockMovements=d.stockMovements||[];
 usage.forEach(x=>d.stockMovements.push({id:"OUT"+Date.now()+Math.random().toString(16).slice(2),date,type:"meal-consumption",itemId:x.itemId,itemName:x.itemName,quantity:x.quantity,unit:x.unit,reference:meal+" - "+selected.map(r=>r.name).join(" + "),memberCount:snapshots.length}));
 if(!write(d))return;
 notice("Meal Saved",""+snapshots.length+" members ki choice, individual bill aur ration deduction save ho gaya.","success");
 entryRecipeIds=[];entryMembers=[];renderEntryLists();renderRecords();
}
function renderCook(){
 const d=read(),s=$("cookSelect"),staff=Array.isArray(d.staff)?d.staff:[],list=staff.filter(x=>String(x.status||"Active").toLowerCase()==="active"&&String(x.duty||"").toLowerCase()==="cook"),old=s.value;
 s.innerHTML='<option value="">Cook select karein</option>'+list.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name||"Cook")+'</option>').join("");
 if(list.some(x=>String(x.id)===old))s.value=old;else if(list.length)s.value=list[0].id;
 syncCook();
}
function syncCook(){const s=(read().staff||[]).find(x=>String(x.id)===$("cookSelect").value);$("cookPhone").value=s?String(s.phone||s.mobile||s.contact||"").replace(/\D/g,""):""}
function renderRecords(){
 const d=read(),rows=(Array.isArray(d.mealRecords)?d.mealRecords:[]).slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))||String(a.mealType||"").localeCompare(String(b.mealType||"")));
 const host=$("savedMealCards");if(!host)return;
 host.innerHTML=rows.map(r=>{
  const members=Array.isArray(r.memberSnapshots)?r.memberSnapshots:[],ids=Array.isArray(r.memberIds)?r.memberIds:[],names=members.map(x=>x.name).filter(Boolean);
  const veg=members.filter(x=>String(x.foodChoice||"").toLowerCase()==="veg").length,nonveg=members.filter(x=>String(x.foodChoice||"").toLowerCase().includes("non")).length,both=members.filter(x=>String(x.foodChoice||"").toLowerCase()==="both").length;
  const memberRows=members.length?members.map((m,i)=>'<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #e2e9e4"><div style="min-width:0;flex:1"><b>'+esc(m.name||("Member "+(i+1)))+'</b>'+(m.forceNo?'<div class="mm-muted">ID: '+esc(m.forceNo)+'</div>':'')+'<div class="mm-muted">'+esc(m.foodChoice||"Food choice not saved")+'</div>'+(Array.isArray(m.dishes)&&m.dishes.length?'<div class="mm-muted">Dish: '+esc(m.dishes.join(", "))+'</div>':'')+'</div><b style="white-space:nowrap">'+money(m.charge||0)+'</b></div>').join(""):'<p class="mm-muted">'+(ids.length?ids.length+" members saved; old record has no member detail.": "Member details not available in this record.")+'</p>';
  const ration=(r.ingredientUsage||[]).map(x=>'<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0"><span>'+esc(x.itemName||"Ration item")+'</span><b>'+esc(String(x.recipeQuantity??x.quantity??""))+' '+esc(x.recipeUnit||x.unit||"")+'</b></div>').join("");
  return '<article class="saved-meal-card" style="border:1px solid var(--border);border-radius:14px;background:#fff;padding:14px;margin:12px 0;color:var(--text)"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><h3 style="margin:0">'+esc(r.mealType||"Meal")+'</h3><span style="font-size:13px;font-weight:700;color:#176747">✓ SAVED</span></div><p style="margin:8px 0;color:var(--muted)">'+esc(r.date||"Date not available")+'</p><div style="padding:10px;background:#f2f6f3;border-radius:10px"><b>Dishes</b><div>'+esc((r.recipeNames||[r.recipeName||"Details unavailable"]).join(" + "))+'</div></div><div style="margin-top:12px"><b>Members · '+ids.length+'</b><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:7px">'+(members.length?'<span style="background:#e8f4ec;padding:5px 9px;border-radius:20px">Veg: '+veg+'</span><span style="background:#fff0ed;padding:5px 9px;border-radius:20px">Non-Veg: '+nonveg+'</span><span style="background:#f1f2f4;padding:5px 9px;border-radius:20px">Both: '+both+'</span>':"")+'</div>'+memberRows+'</div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 0;border-top:1px solid #e2e9e4"><b>Total meal cost</b><b style="font-size:18px">'+money(r.totalCost||0)+'</b></div>'+(ration?'<details style="margin:5px 0 12px"><summary style="font-weight:700;cursor:pointer;padding:8px 0">Ration used · Details</summary>'+ration+'</details>':'')+'<button type="button" class="sendWA" data-id="'+esc(r.id)+'" style="width:100%;margin-top:8px">WhatsApp Ration</button></article>';
 }).join("")||'<div style="padding:18px;text-align:center;color:var(--muted);border:1px dashed var(--border);border-radius:12px">Abhi koi meal save nahi hua.</div>';
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
function sendCook(id){const d=read(),r=(d.mealRecords||[]).find(x=>String(x.id)===String(id));if(!r)return;const s=(d.staff||[]).find(x=>String(x.id)===$("cookSelect").value),phone=String(s?.phone||s?.mobile||s?.contact||"").replace(/\\D/g,"");if(!phone){notice("Cook Number Missing","Mess Staff mein Cook ka country-code mobile number add karein.","error");return}d.cookRationSent=d.cookRationSent||{};if(d.cookRationSent[r.id]){notice("Already Sent","Is saved meal ka WhatsApp pehle hi open kiya gaya hai.","error");return}const lines=(r.ingredientUsage||[]).map(i=>i.itemName+": "+i.quantity+" "+i.unit),members=(r.memberSnapshots||[]).map(m=>m.name+" ("+m.foodChoice+") — "+(m.dishes||[]).join(", ")),msg=["CRPF MESS RATION",r.date+(r.day?" ("+r.day+")":""),r.mealType,"Dishes: "+(r.recipeNames||[]).join(" + "),"Members:",...members,"Ration:",...lines,"Total: "+money(r.totalCost)],url="https://wa.me/"+phone+"?text="+encodeURIComponent(msg.join("\\n"));const win=window.open(url,"_blank");if(!win){window.location.href=url;return}d.cookRationSent[r.id]={sentAt:new Date().toISOString()};r.cookWhatsAppSent=true;if(write(d)){notice("WhatsApp Ready","WhatsApp khul gaya hai. Ab Send dabayein.","success");renderRecords()}}
$("entryDate").value=today();$("entryDay").value=days[new Date().getDay()];$("entryDate").addEventListener("change",()=>{$("entryDay").value=days[new Date($("entryDate").value+"T12:00:00").getDay()]});
$("addRecipeBtn").addEventListener("click",addEntryRecipe);$("addMemberBtn").addEventListener("click",addEntryMember);$("saveEntryBtn").addEventListener("click",saveEntry);
$("selectedRecipes").addEventListener("click",e=>{const b=e.target.closest(".removeEntryRecipe");if(b){entryRecipeIds=entryRecipeIds.filter(x=>x!==b.dataset.id);renderEntryLists()}});
$("selectedMembers").addEventListener("click",e=>{const b=e.target.closest(".removeEntryMember");if(b){entryMembers=entryMembers.filter(x=>x.id!==b.dataset.id);renderEntryLists()}});
$("selectedMembers").addEventListener("change",e=>{if(e.target.matches(".entryFoodChoice")){const x=entryMembers.find(x=>x.id===e.target.dataset.id);if(x)x.choice=e.target.value;updateEntrySummary()}});
$("cookSelect").addEventListener("change",syncCook);$("savedMealCards").addEventListener("click",e=>{const b=e.target.closest(".sendWA");if(b)sendCook(b.dataset.id)});
$("dateNow").textContent=new Date().toLocaleDateString();renderRecipeOptions();renderMemberOptions();renderEntryLists();renderCook();renderRecords();
})();