/* Santos Cooking House - Fresh Daily Making */
(function(){
"use strict";
const KEY="crpfMessData", $=id=>document.getElementById(id);
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return {}}};
const write=d=>{try{localStorage.setItem(KEY,JSON.stringify(d));return true}catch(e){alert("Save nahi hua. Browser storage full ho sakta hai.");return false}};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=v=>"Rs "+Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
let selectedRecipeIds=[], selectedMembers=[], editingId=null;
function data(){return read()}
function recipes(){return Array.isArray(data().recipes)?data().recipes:[]}
function members(){return (Array.isArray(data().members)?data().members:[]).filter(m=>String(m.status||"Active").toLowerCase()==="active")}
function typeOf(r){let t=String(r.foodType||r.type||"Both").toLowerCase();return t==="veg"?"Veg":(t==="non-veg"||t==="nonveg")?"Non-Veg":"Both"}
function unitGroup(u){u=String(u||"").toLowerCase();if(["g","gram","grams"].includes(u))return ["w",1];if(["kg","kgs"].includes(u))return ["w",1000];if(u==="ml")return ["v",1];if(["l","ltr","litre","liter"].includes(u))return ["v",1000];if(["pcs","pc","piece","pieces"].includes(u))return ["c",1];return null}
function convert(q,a,b){const x=unitGroup(a),y=unitGroup(b);return !x||!y||x[0]!==y[0]?null:Number(q)*x[1]/y[1]}
function unitForItem(item){const u=String(item.unit||"").toLowerCase();return ["kg","kgs","g","gram","grams"].includes(u)?"g":["ltr","l","litre","liter","ml"].includes(u)?"ml":"pcs"}
function dayUpdate(){const v=$("entryDate").value;if(v)$("entryDay").value=days[new Date(v+"T12:00:00").getDay()]}
function renderRecipes(){const list=recipes(),sel=$("recipeSelect"),old=sel.value;sel.innerHTML='<option value="">Recipe select karein</option>'+list.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.name)+" · "+esc(typeOf(r))+"</option>").join("");if(list.some(r=>String(r.id)===old))sel.value=old}
function renderMemberOptions(){const q=$("memberSearch").value.trim().toLowerCase(),sel=$("memberSelect"),old=sel.value;sel.innerHTML='<option value="">Member select karein</option>'+members().filter(m=>(String(m.name||"")+" "+String(m.forceNo||m.forceNumber||"")).toLowerCase().includes(q)).map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name||"Member")+(m.forceNo||m.forceNumber?" · "+esc(m.forceNo||m.forceNumber):"")+"</option>").join("");if([...sel.options].some(o=>o.value===old))sel.value=old}
function addRecipe(){const id=String($("recipeSelect").value);if(!id)return alert("Pehle recipe select karein.");if(!selectedRecipeIds.includes(id))selectedRecipeIds.push(id);renderForm()}
function addMember(){const id=String($("memberSelect").value);if(!id)return alert("Pehle member select karein.");if(!selectedMembers.some(m=>String(m.id)===id))selectedMembers.push({id,choice:"Veg",dishIds:selectedRecipeIds.slice()});renderForm()}
function dishChoices(m){const available=recipes().filter(r=>selectedRecipeIds.includes(String(r.id))&&(typeOf(r)==="Both"||typeOf(r)===m.choice));return available}
function renderForm(){
 const rs=recipes();
 $("selectedRecipes").innerHTML=selectedRecipeIds.length?selectedRecipeIds.map(id=>{const r=rs.find(x=>String(x.id)===id);return r?'<span>'+esc(r.name)+' <button type="button" class="removeRecipe" data-id="'+esc(id)+'">×</button></span>':""}).join(""):"<span>Recipe abhi add nahi hui</span>";
 $("selectedMembers").innerHTML=selectedMembers.length?selectedMembers.map(m=>{const p=members().find(x=>String(x.id)===String(m.id));if(!p)return "";const opts=dishChoices(m);return '<div class="mm-choice" style="display:block;background:#fff;color:var(--text)"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="flex:1">'+esc(p.name||"Member")+'</b><small>'+esc(p.forceNo||p.forceNumber||"")+'</small><select class="foodChoice" data-id="'+esc(m.id)+'" style="width:auto;min-width:110px"><option '+(m.choice==="Veg"?"selected":"")+' value="Veg">Veg</option><option '+(m.choice==="Non-Veg"?"selected":"")+' value="Non-Veg">Non-Veg</option></select><button type="button" class="removeMember" data-id="'+esc(m.id)+'">Remove</button></div><div style="margin-top:9px"><b>Kaun sa khana khayenge?</b>'+opts.map(r=>'<label style="display:flex;gap:8px;align-items:center;margin:7px 0;font-weight:500"><input type="checkbox" class="memberDish" data-member="'+esc(m.id)+'" value="'+esc(r.id)+'" '+(m.dishIds.includes(String(r.id))?"checked":"")+' style="width:auto;margin:0"> '+esc(r.name)+' <small style="margin-left:auto">'+money(r.costPerServing||r.totalCost||0)+'</small></label>').join("")+(opts.length?"":'<p class="mm-muted">Is choice ke liye recipe nahi hai.</p>')+'</div></div>'}).join(""):'<p class="mm-muted">Abhi member add nahi hua.</p>';
 updateSummary();
}
function recipeIngredients(rs,d){const map=new Map();rs.forEach(r=>(r.ingredients||[]).forEach(i=>{const itemId=String(i.itemId||""),item=(d.ration||[]).find(x=>String(x.id)===itemId),unit=String(i.unit||item?.unit||"");const q=Number(i.quantity||0);if(!itemId||!unit||q<=0)return;const key=itemId+"|"+unit,old=map.get(key)||{itemId,itemName:i.itemName||item?.name||"Ration",quantity:0,unit};old.quantity+=q;map.set(key,old)}));return [...map.values()]}
function updateSummary(){
 const rs=recipes();let peopleCost=0,valid=0;
 const rows=selectedMembers.map(m=>{const p=members().find(x=>String(x.id)===String(m.id)),dishes=dishChoices(m).filter(r=>m.dishIds.includes(String(r.id)));const charge=dishes.reduce((s,r)=>s+Number(r.costPerServing||r.totalCost||0),0);if(dishes.length){valid++;peopleCost+=charge}return (p?.name||"Member")+": "+dishes.map(x=>x.name).join(", ")+" — "+money(charge)});
 $("entrySummary").innerHTML='<b>Members:</b> '+selectedMembers.length+' &nbsp; <b>Total meal cost:</b> '+money(peopleCost)+'<br>'+rows.map(esc).join("<br>");
}
function clearForm(){selectedRecipeIds=[];selectedMembers=[];editingId=null;$("saveEntryBtn").textContent="✓ Aaj ki Hajiri Save & Ration Deduct";$("entryDate").value=today();$("entryMeal").value="Morning Tea";dayUpdate();renderForm()}
function reverseStock(d,r){(r.ingredientUsage||[]).forEach(u=>{const item=(d.ration||[]).find(x=>String(x.id)===String(u.itemId));if(item)item.quantity=Number(item.quantity||0)+Number(u.quantity||0)});d.stockMovements=(d.stockMovements||[]).filter(x=>String(x.referenceId||"")!==String(r.id))}
function buildRecord(d){
 const date=$("entryDate").value,meal=$("entryMeal").value,day=$("entryDay").value;
 if(!date)return alert("Date select karein.");
 if(!selectedRecipeIds.length)return alert("Kam se kam ek recipe add karein.");
 if(!selectedMembers.length)return alert("Khana khane wale members add karein.");
 const allRecipes=recipes(),allMembers=members(),usageMap=new Map(),snapshots=[];
 for(const entry of selectedMembers){
  const member=allMembers.find(m=>String(m.id)===String(entry.id));if(!member)return alert("Member list refresh karein.");
  const dishes=dishChoices(entry).filter(r=>entry.dishIds.includes(String(r.id)));
  if(!dishes.length)return alert(member.name+" ke liye dishes select karein.");
  const ingredients=recipeIngredients(dishes,d);
  if(!ingredients.length)return alert(member.name+" ki recipe ingredients missing hain.");
  ingredients.forEach(i=>{const key=i.itemId+"|"+i.unit,old=usageMap.get(key)||{...i,quantity:0};old.quantity+=i.quantity;usageMap.set(key,old)});
  const charge=dishes.reduce((s,r)=>s+Number(r.costPerServing||r.totalCost||0),0);
  snapshots.push({id:String(member.id),name:member.name||"",forceNo:member.forceNo||member.forceNumber||"",foodChoice:entry.choice,dishes:dishes.map(r=>r.name),charge,perServingIngredients:ingredients.map(i=>({itemId:i.itemId,itemName:i.itemName,quantity:i.quantity,unit:i.unit}))});
 }
 const usage=[];
 for(const x of usageMap.values()){const item=(d.ration||[]).find(i=>String(i.id)===String(x.itemId));if(!item)return alert(x.itemName+" Ration Store mein nahi mila.");const q=convert(x.quantity,x.unit,item.unit);if(q===null)return alert(x.itemName+" ka unit match nahi ho raha.");if(Number(item.quantity||0)+1e-9<q)return alert(x.itemName+" ka stock kam hai. Required "+x.quantity+" "+x.unit);usage.push({itemId:x.itemId,itemName:item.name||x.itemName,recipeQuantity:x.quantity,recipeUnit:x.unit,quantity:q,unit:item.unit})}
 const totalCost=snapshots.reduce((s,m)=>s+m.charge,0);
 return {id:editingId||"MEAL"+Date.now(),date,day,mealType:meal,recipeIds:[...new Set(selectedMembers.flatMap(m=>m.dishIds))],recipeNames:[...new Set(snapshots.flatMap(m=>m.dishes))],memberIds:snapshots.map(m=>m.id),memberSnapshots:snapshots,totalCost,chargePerMember:snapshots.length?totalCost/snapshots.length:0,ingredientUsage:usage,createdAt:new Date().toISOString()};
}
function saveEntry(){
 const d=read();d.mealRecords=Array.isArray(d.mealRecords)?d.mealRecords:[];
 const old=editingId?d.mealRecords.find(r=>String(r.id)===String(editingId)):null;
 if(!editingId&&d.mealRecords.some(r=>String(r.date)===String($("entryDate").value)&&String(r.mealType)===String($("entryMeal").value)))return alert("Is date aur meal ki hajiri pehle se saved hai.");
 if(old)reverseStock(d,old);
 const rec=buildRecord(d);
 if(!rec){if(old){(old.ingredientUsage||[]).forEach(u=>{const item=(d.ration||[]).find(x=>String(x.id)===String(u.itemId));if(item)item.quantity=Number(item.quantity||0)-Number(u.quantity||0)})}return}
 if(!confirm((old?"Update":"Save")+" "+rec.date+" · "+rec.mealType+" · "+rec.memberIds.length+" members · "+money(rec.totalCost)+"? Ration stock update hoga.")){if(old)(old.ingredientUsage||[]).forEach(u=>{const item=(d.ration||[]).find(x=>String(x.id)===String(u.itemId));if(item)item.quantity=Number(item.quantity||0)-Number(u.quantity||0)});return}
 rec.createdAt=old?.createdAt||rec.createdAt;
 rec.updatedAt=new Date().toISOString();
 if(old){const ix=d.mealRecords.findIndex(r=>String(r.id)===String(old.id));d.mealRecords[ix]=rec}else d.mealRecords.push(rec);
 rec.ingredientUsage.forEach(u=>{const item=(d.ration||[]).find(x=>String(x.id)===String(u.itemId));item.quantity=Number(item.quantity||0)-u.quantity});
 d.stockMovements=Array.isArray(d.stockMovements)?d.stockMovements:[];
 d.stockMovements=d.stockMovements.filter(x=>String(x.referenceId||"")!==String(rec.id));
 rec.ingredientUsage.forEach(u=>d.stockMovements.push({id:"OUT"+Date.now()+Math.random().toString(16).slice(2),date:rec.date,type:"meal-consumption",itemId:u.itemId,itemName:u.itemName,quantity:u.quantity,unit:u.unit,reference:rec.mealType+" - "+rec.recipeNames.join(" + "),referenceId:rec.id,memberCount:rec.memberIds.length}));
 if(!write(d))return;
 alert(old?"Meal record updated. Ration stock adjusted.":"Hajiri saved. Member bill aur ration stock update ho gaya.");
 clearForm();renderRecords();
}
function editRecord(id){
 const r=(data().mealRecords||[]).find(x=>String(x.id)===String(id));if(!r)return;
 editingId=String(id);$("entryDate").value=r.date||today();$("entryMeal").value=r.mealType||"Breakfast";dayUpdate();
 selectedRecipeIds=(r.recipeIds||[]).map(String);
 selectedMembers=(r.memberSnapshots||[]).map(m=>({id:String(m.id),choice:m.foodChoice||"Veg",dishIds:(m.dishes||[]).map(n=>{const x=recipes().find(q=>q.name===n);return x?String(x.id):""}).filter(Boolean)}));
 $("saveEntryBtn").textContent="Update Meal & Ration";renderForm();$("entryDate").scrollIntoView({behavior:"smooth",block:"center"});
}
function deleteRecord(id){
 const d=read(),r=(d.mealRecords||[]).find(x=>String(x.id)===String(id));if(!r)return;
 if(!confirm(r.date+" "+r.mealType+" record delete karein? Ration stock wapas add hoga. Member meal bill bhi is record se hat jayega."))return;
 reverseStock(d,r);d.mealRecords=d.mealRecords.filter(x=>String(x.id)!==String(id));if(!write(d))return;alert("Meal record deleted. Ration stock restored.");renderRecords();
}
function renderRecords(){
 const rows=(data().mealRecords||[]).slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))),host=$("savedMealCards");
 host.innerHTML=rows.map(r=>'<article class="panel" style="padding:13px;margin:10px 0;background:#fff;color:var(--text)"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>'+esc(r.date)+' · '+esc(r.mealType)+'</b><b>'+money(r.totalCost)+'</b></div><p class="mm-muted">'+esc((r.recipeNames||[]).join(", "))+' · '+(r.memberIds||[]).length+' members</p>'+((r.memberSnapshots||[]).map(m=>'<div style="padding:7px 0;border-top:1px solid var(--border)"><b>'+esc(m.name)+'</b> · '+esc(m.foodChoice)+' · '+esc((m.dishes||[]).join(", "))+'<b style="float:right">'+money(m.charge)+'</b></div>').join(""))+'<div class="mm-actions"><button type="button" class="viewRecord" data-id="'+esc(r.id)+'">View</button><button type="button" class="editRecord" data-id="'+esc(r.id)+'">Edit</button><button type="button" class="deleteRecord" data-id="'+esc(r.id)+'">Delete</button></div></article>').join("")||'<p class="mm-muted">Abhi koi saved meal nahi hai.</p>';
}
function init(){
 $("entryDate").value=today();dayUpdate();$("dateNow").textContent=new Date().toLocaleDateString();
 renderRecipes();renderMemberOptions();renderForm();renderRecords();
 $("entryDate").addEventListener("change",dayUpdate);
 $("memberSearch").addEventListener("input",renderMemberOptions);
 $("addRecipeBtn").addEventListener("click",addRecipe);$("addMemberBtn").addEventListener("click",addMember);
 $("addAllMembersBtn").addEventListener("click",()=>{let n=0;members().forEach(m=>{if(!selectedMembers.some(x=>String(x.id)===String(m.id))){selectedMembers.push({id:String(m.id),choice:"Veg",dishIds:selectedRecipeIds.slice()});n++}});renderForm();alert(n+" members add hue. Har member ki dish aur Veg/Non-Veg choice check karein.")});
 $("saveEntryBtn").addEventListener("click",saveEntry);$("resetEntryBtn").addEventListener("click",clearForm);
 $("recipeSelect").addEventListener("change",()=>{});
 $("selectedRecipes").addEventListener("click",e=>{const b=e.target.closest(".removeRecipe");if(b){selectedRecipeIds=selectedRecipeIds.filter(x=>x!==b.dataset.id);selectedMembers.forEach(m=>m.dishIds=m.dishIds.filter(x=>x!==b.dataset.id));renderForm()}});
 $("selectedMembers").addEventListener("click",e=>{const b=e.target.closest(".removeMember");if(b){selectedMembers=selectedMembers.filter(x=>x.id!==b.dataset.id);renderForm()}});
 $("selectedMembers").addEventListener("change",e=>{const m=selectedMembers.find(x=>x.id===e.target.dataset.id);if(!m)return;if(e.target.classList.contains("foodChoice")){m.choice=e.target.value;m.dishIds=[];renderForm()}if(e.target.classList.contains("memberDish")){const id=e.target.value;if(e.target.checked&&!m.dishIds.includes(id))m.dishIds.push(id);if(!e.target.checked)m.dishIds=m.dishIds.filter(x=>x!==id);updateSummary()}});
 $("savedMealCards").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.classList.contains("editRecord"))editRecord(b.dataset.id);if(b.classList.contains("deleteRecord"))deleteRecord(b.dataset.id);if(b.classList.contains("viewRecord")){const r=(data().mealRecords||[]).find(x=>String(x.id)===String(b.dataset.id));if(r)alert(r.date+" "+r.mealType+"\n"+(r.memberSnapshots||[]).map(m=>m.name+": "+(m.dishes||[]).join(", ")+" — "+money(m.charge)).join("\n"))}});
}
init();
})();