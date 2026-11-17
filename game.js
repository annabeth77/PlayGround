const recipes = [
  {id:'candle',name:'Honey candle',emoji:'🕯️',price:18,needs:{wax:2,herbs:1},time:'1 min'},
  {id:'plush',name:'Pocket plushie',emoji:'🧸',price:26,needs:{cloth:2,thread:1},time:'2 min'},
  {id:'scarf',name:'Cloud-soft scarf',emoji:'🧣',price:22,needs:{wool:2,thread:1},time:'1 min'},
  {id:'jam',name:'Berry jam',emoji:'🍓',price:15,needs:{berries:2,jar:1},time:'1 min'},
  {id:'bouquet',name:'Wildflower bunch',emoji:'💐',price:20,needs:{flowers:2,thread:1},time:'1 min'},
  {id:'mug',name:'Mushroom mug',emoji:'🍄',price:32,needs:{clay:2,glaze:1},time:'3 min'}
];
const supplyData = {
  wax:{name:'Beeswax',icon:'🐝'},herbs:{name:'Herbs',icon:'🌿'},cloth:{name:'Cotton',icon:'🧵'},thread:{name:'Thread',icon:'🪡'},
  wool:{name:'Wool',icon:'🐑'},berries:{name:'Berries',icon:'🫐'},jar:{name:'Jars',icon:'🫙'},flowers:{name:'Flowers',icon:'🌼'},clay:{name:'Clay',icon:'🪨'},glaze:{name:'Glaze',icon:'🎨'}
};
const costPerSupply=4;
const initialState={cash:70,day:1,rep:0,supplies:{wax:4,herbs:3,cloth:4,thread:4,wool:3,berries:4,jar:3,flowers:3,clay:3,glaze:2},goods:[],orders:[],visitors:0,sold:0,made:0,upgrades:{},lastOrder:0};
let state=loadState(), toastTimer, customerTimer, orderTimer;
const $=s=>document.querySelector(s);
function loadState(){try{const saved=JSON.parse(localStorage.getItem('littleWorkshopSave'));if(saved)return {...structuredClone(initialState),...saved,supplies:{...initialState.supplies,...saved.supplies},upgrades:{...initialState.upgrades,...saved.upgrades}}}catch(e){}return structuredClone(initialState)}
function save(){localStorage.setItem('littleWorkshopSave',JSON.stringify(state))}
const money=n=>'$'+Math.floor(n);
function notify(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2300)}
function setup(){
  if(!state.orders.length)makeOrders();
  render();
  customerTimer=setInterval(addCustomer,9000);
  orderTimer=setInterval(()=>{if(state.orders.length<3){addOrder();renderOrders()}},45000);
  $('#recipe-list').addEventListener('click',e=>{const btn=e.target.closest('[data-craft]');if(btn)craft(btn.dataset.craft)});
  $('#goods-list').addEventListener('click',e=>{const btn=e.target.closest('[data-sell]');if(btn)sellGood(btn.dataset.sell)});
  $('#buy-supplies').onclick=showRestock;
  $('#sell-all').onclick=sellAll;
  $('#next-day').onclick=endDay;
  $('#sound-toggle').onclick=()=>notify('A little bird sings somewhere nearby. ♫');
  $('#upgrade-open').onclick=showUpgrade;
  $('#reset-game').onclick=confirmReset;
  $('#modal-backdrop').addEventListener('click',e=>{if(e.target.id==='modal-backdrop')closeModal()});
}
function render(){
  $('#cash').textContent=money(state.cash);$('#day-label').textContent='Day '+state.day;$('#rep').textContent=state.rep;
  $('#visitor-count').textContent=state.visitors;$('#stock-count').textContent=state.goods.length;
  renderOrders();renderRecipes();renderSupplies();renderGoods();renderGoals();
}
function makeOrders(){state.orders=[];for(let i=0;i<3;i++)addOrder(false);}
function addOrder(fresh=true){
  const available=recipes.filter(r=>!state.orders.some(o=>o.recipe===r.id));
  const recipe=available[Math.floor(Math.random()*available.length)]||recipes[Math.floor(Math.random()*recipes.length)];
  const order={id:Date.now()+Math.random(),recipe:recipe.id,reward:Math.ceil(recipe.price*1.35),customer:['Mina','Theo','Poppy','Jun','Clover','Milo'][Math.floor(Math.random()*6)],emoji:['👩🏻‍🌾','🧑🏽‍🎨','👵🏻','🧔🏽','👩🏾‍🦱','🧑🏻‍🦰'][Math.floor(Math.random()*6)]};
  state.orders.push(order);if(fresh&&state.orders.length===1)state.lastOrder=Date.now();save();
}
function renderOrders(){
  $('#orders-list').innerHTML=state.orders.length?state.orders.slice(0,3).map(o=>{const r=recipes.find(x=>x.id===o.recipe);const have=state.goods.filter(g=>g.recipe===o.recipe).length;return `<article class="order-card"><div class="order-top"><span class="order-item">${r.name}</span><span class="order-emoji">${o.emoji}</span></div><div class="order-reward">${money(o.reward)} <small>+ a happy customer</small></div><div class="order-progress"><i style="width:${have?'100':'0'}%"></i></div></article>`}).join(''):'<div class="empty-shelf">No wishes just now. New neighbors will stop by soon!</div>';
}
function renderRecipes(){
  $('#recipe-list').innerHTML=recipes.map(r=>{const can=Object.entries(r.needs).every(([k,n])=>state.supplies[k]>=n);return `<button class="recipe" data-craft="${r.id}" ${can?'':'disabled'} title="${can?'Make '+r.name:'Not enough supplies'}"><span class="recipe-emoji">${r.emoji}</span><span class="recipe-copy"><b>${r.name}</b><small>${Object.entries(r.needs).map(([k,n])=>`${supplyData[k].icon}${n}`).join(' ')} · ${r.time}</small></span><span class="recipe-price">${money(r.price)}</span></button>`}).join('');
}
function renderSupplies(){ $('#supplies').innerHTML=Object.entries(state.supplies).map(([k,n])=>`<div class="supply" title="${supplyData[k].name}"><span>${supplyData[k].icon} ${supplyData[k].name}</span><b>${n}</b></div>`).join('') }
function renderGoods(){
  const shelf=$('#goods-list');
  shelf.innerHTML=state.goods.length?state.goods.map(g=>{const r=recipes.find(x=>x.id===g.recipe);return `<div class="goods-card"><span class="goods-emoji">${r.emoji}</span><span class="goods-info"><b>${r.name}</b><small>Handmade · ${money(r.price)}</small></span><button class="goods-sell" data-sell="${g.id}">Sell</button></div>`}).join(''):'<div class="empty-shelf">Your shelf is waiting for its first handmade treasure ✿</div>';
}
function goals(){return [
  {id:'make3',label:'Make 3 lovely things',sub:`${Math.min(state.made,3)} of 3 made`,done:state.made>=3,reward:'$20'},
  {id:'sell2',label:'Find homes for 2 creations',sub:`${Math.min(state.sold,2)} of 2 sold`,done:state.sold>=2,reward:'+2 rep'},
  {id:'rep5',label:'Become a neighborhood favorite',sub:`${Math.min(state.rep,5)} of 5 rep`,done:state.rep>=5,reward:'✿'}
]}
function renderGoals(){ $('#goal-list').innerHTML=goals().map(g=>`<div class="goal-row ${g.done?'done':''}"><span class="goal-check">${g.done?'✓':''}</span><span class="goal-copy"><b>${g.label}</b><small>${g.sub}</small></span><span class="goal-reward">${g.done?'DONE':g.reward}</span></div>`).join('') }
function canCraft(r){return Object.entries(r.needs).every(([key,count])=>state.supplies[key]>=count)}
function craft(id){
 const r=recipes.find(x=>x.id===id);if(!r||!canCraft(r)){notify('You need a few more supplies for that one.');return}
 for(const [key,count] of Object.entries(r.needs))state.supplies[key]-=count;
 state.goods.unshift({id:Date.now()+Math.random(),recipe:r.id,price:r.price});state.made++;
 const order=state.orders.find(o=>o.recipe===r.id);$('#market-message').textContent=order?`${order.customer} is hoping for a ${r.name.toLowerCase()}!`:`A fresh ${r.name.toLowerCase()} is ready for the shelf.`;
 save();render();notify(`${r.emoji} ${r.name} made by hand!`);
}
function sellGood(id){
 const index=state.goods.findIndex(g=>String(g.id)===id);if(index<0)return;
 const [good]=state.goods.splice(index,1), recipe=recipes.find(r=>r.id===good.recipe), orderIndex=state.orders.findIndex(o=>o.recipe===good.recipe);
 const shelfBonus=state.upgrades.shelf?1:0, priceBonus=state.upgrades.sign?2:0;
 if(orderIndex>=0){const order=state.orders.splice(orderIndex,1)[0];state.cash+=order.reward+priceBonus;state.rep+=1+shelfBonus;state.sold++;state.visitors++;showCustomer(order.emoji);$('#market-message').textContent=`${order.customer} loves their ${recipe.name.toLowerCase()}!`;notify(`Wish fulfilled! ${money(order.reward+priceBonus)} and +${1+shelfBonus} neighborhood rep ♡`);addOrder();}
 else {const amount=good.price+priceBonus;state.cash+=amount;state.rep+=shelfBonus;state.sold++;state.visitors++;showCustomer();$('#market-message').textContent=`A happy neighbor found a ${recipe.name.toLowerCase()}!`;notify(`${recipe.emoji} Sold for ${money(amount)}. Lovely!`)}
 save();render();
}
function sellAll(){if(!state.goods.length){notify('Make a little something first!');return}const ids=state.goods.map(g=>String(g.id));ids.forEach(sellGood);}
function showCustomer(emoji){const lane=$('#customer-lane'),figure=document.createElement('span');figure.className='customer';figure.textContent=emoji||['🧑🏻','👩🏽','👨🏼','👩🏻‍🦰'][Math.floor(Math.random()*4)];lane.append(figure);setTimeout(()=>figure.remove(),4500)}
function addCustomer(){if(state.orders.length<3)addOrder();state.visitors++;showCustomer();if(state.visitors%3===0)$('#market-message').textContent='The neighborhood is starting to notice your little shop!';$('#visitor-count').textContent=state.visitors;save();renderOrders()}
function endDay(){
 const bonus=8+Math.min(state.rep,12)+(state.upgrades.tea?8:0);state.cash+=bonus;state.day++;state.visitors=0;state.orders=[];makeOrders();
 $('#market-message').textContent=`Day ${state.day} is here! The morning sun is lovely.`;$('#customer-lane').innerHTML='';save();render();notify(`New day! You earned ${money(bonus)} for opening your shop.`);
}
function showRestock(){
 const options=[['starter','✿','Little basket','A few of everything to get making.','20',{wax:2,herbs:1,cloth:2,thread:2,wool:1,berries:2,jar:1,flowers:1,clay:1,glaze:1}],['textiles','🧶','Thread & textiles','Cotton, thread, and wool for soft things.','16',{cloth:4,thread:4,wool:3}],['garden','🌿','Garden gather','Herbs, berries, flowers, and beeswax.','14',{wax:3,herbs:3,berries:3,flowers:3}],['pottery','🏺','Potter’s bundle','Clay and glaze for little keepsakes.','12',{clay:4,glaze:3}]];
 $('#modal').innerHTML=`<p class="eyebrow">A QUICK TRIP TO THE SUPPLY MARKET</p><h2>Restock your basket</h2><p>Good materials make good things. Pick a bundle and get right back to making.</p><div class="modal-options">${options.map(([id,icon,name,desc,price])=>`<button class="upgrade-option" data-bundle="${id}" ${state.cash<price?'disabled':''}><span>${icon}</span><div><b>${name}</b><small>${desc}</small></div><strong>$${price}</strong></button>`).join('')}</div><div class="modal-actions"><button class="modal-close" data-close>Maybe later</button></div>`;
 $('#modal').querySelectorAll('[data-bundle]').forEach(btn=>btn.onclick=()=>buyBundle(btn.dataset.bundle,options));wireClose();$('#modal-backdrop').classList.add('show');
}
function buyBundle(id,options){const bundle=options.find(o=>o[0]===id);if(!bundle||state.cash<Number(bundle[4]))return;state.cash-=Number(bundle[4]);Object.entries(bundle[5]).forEach(([key,n])=>state.supplies[key]+=n);save();render();closeModal();notify('Supplies restocked. Time to make something! ✂')}
function showUpgrade(){
 const list=[
  {id:'sign',icon:'🪧',name:'A hand-painted sign',desc:'Raise every sale by $2.',price:45},
  {id:'shelf',icon:'🪴',name:'A charming display shelf',desc:'Every sale earns +1 neighborhood rep.',price:65},
  {id:'tea',icon:'🫖',name:'Tea for the road',desc:'Daily opening bonus +$8.',price:55}
 ];
 $('#modal').innerHTML=`<p class="eyebrow">MAKE YOUR LITTLE SHOP EVEN LOVELIER</p><h2>Workshop upgrades</h2><p>Small touches bring the whole neighborhood by.</p><div class="modal-options">${list.map(u=>`<button class="upgrade-option" data-upgrade="${u.id}" ${state.upgrades[u.id]||state.cash<u.price?'disabled':''}><span>${u.icon}</span><div><b>${u.name}${state.upgrades[u.id]?' · owned':''}</b><small>${u.desc}</small></div><strong>${state.upgrades[u.id]?'✓':'$'+u.price}</strong></button>`).join('')}</div><div class="modal-actions"><button class="modal-close" data-close>Close</button></div>`;
 $('#modal').querySelectorAll('[data-upgrade]').forEach(btn=>btn.onclick=()=>{const u=list.find(x=>x.id===btn.dataset.upgrade);if(!u||state.upgrades[u.id]||state.cash<u.price)return;state.cash-=u.price;state.upgrades[u.id]=true;save();render();showUpgrade();notify(`${u.name} added!`)});wireClose();$('#modal-backdrop').classList.add('show');
}
function wireClose(){$('#modal').querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal)}
function closeModal(){$('#modal-backdrop').classList.remove('show')}
function confirmReset(){
 $('#modal').innerHTML='<p class="eyebrow">A FRESH LITTLE START</p><h2>Start over?</h2><p>Your workshop, savings, and keepsakes will be reset. You can always grow a new garden.</p><div class="modal-actions"><button class="modal-close" data-close>Keep playing</button><button class="danger-btn" id="confirm-reset">Start fresh</button></div>';
 wireClose();$('#modal-backdrop').classList.add('show');$('#confirm-reset').onclick=()=>{localStorage.removeItem('littleWorkshopSave');state=structuredClone(initialState);makeOrders();save();render();closeModal();notify('A fresh new workshop awaits! ✿')};
}
setup();
