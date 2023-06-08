export const registerIbe = () => {
  OSEIBE.data = class IBE {
    static table = [
      {
        e: 9,
        p: 16,
        r: { x: 30, e: 10, o: 6 }
      },
      {
        e: 7,
        p: 14,
        r: { x: 60, e: 20, o: 12 }
      },
      {
        e: 5,
        p: 12,
        r: { x: 90, e: 30, o: 18 }
      },
      {
        e: 3,
        p: 10,
        r: { x: 120, e: 40, o: 24 }
      }
    ];
  };
  Hooks.on('renderActorSheet', async (actor, html) => {
/*
    Order of operations:
    get actor object
    get list of containers
    -if containers, add object to array {containerid, containerItemIds}
    -add containerIds to packedIds
    get equipped Items - actor items.filter(not included in containerItemids)
    get weapon items
    get armor items


*/













    const actorObj = actor.object;

    if (actorObj.type == 'character') {
      let P = 0;
      let E = 0;
      let pItems = [];
      let aCont = actorObj.items.filter((i) => i.type === 'container');
      let containerItemIds = [];
      for (let cont of aCont) {
        const contItems = cont.system.itemIds;
        contItems.map((i) => containerItemIds.push(i.id));

        let items = contItems.filter(async (i) =>{
          const itemObj = await actorObj.items.get(i)
          return itemObj.system.tags?.find((t) => t.title.includes('bundle-'))
            ? false
            : itemObj.system.tags?.find((t) => t.title.includes('Currency'))
            ? false
            : true
        }
        );
        
        let bundles = contItems.filter(async (i) =>{
          const itemObj = await actorObj.items.get(i);
          return itemObj.system.tags?.find((t) => t.title.includes('bundle-')) ? true : false
        }
          
        );
        P += countBundle(bundles, actorObj);

        items.forEach(async (i) => {
          const itemObj = await actorObj.items.get(i)
          P += itemObj.system.weight ? itemObj.system.weight : 0;
        });

        splitCoins('p', contItems, containerItemIds, actorObj)
      }
      // let aItems = actorObj.items
      //   .filter((i) => i.type === 'item' && !containerItemIds.includes(i.id) && i.data)
      //   .filter((i) => (i.system.manualTags?.find((t) => t.title === 'Currency') ? false : true));
      // E += aItems.length;
      
      const weapons = actorObj.items.filter((i) => i.type === 'weapon');
      let eWeap = weapons.filter((w) => w.system.equipped);
      let pWeap = weapons.filter((w) => !w.system.equipped);
      eWeap.map(w=>E += w.system.weight);
      pWeap.map(w=>P += w.system.weight);
      // E+= eWeap.length;
      // P += weapons.length - eWeap.length;
      
      const armor = actorObj.items.filter((i) => i.type === 'armor');
      let eArmor = armor.filter((a) => a.system.equipped);
      E += eArmor.length;
      P += armor.length - eArmor.length;
      
      
      let table = OSEIBE.data.table;
      splitCoins('e', actorObj.items, containerItemIds, actorObj);

      await setRate(E, P, table, actorObj);

      addIBEdisplay(html, P, E);

      async function splitCoins(type, items, contIds, actor) {
        const coins = []
        actor.items.map(async (i) => {
          let cur = i.system.tags?.find((t) => t.title === 'Currency' && contIds.includes(i.id));
          if(cur){
            coins.push(i)
          }
        });
        for (let coin of coins) {
          
          const itemObj = await actor.items.get(coin);
          let qty = coin.system.quantity.value;
          let mod = 0;
          
          
          if (contIds.includes(coin.id)) {
            if (qty > 0) {
              

              P += Math.ceil(qty / 100) + mod;
            }
          }
          if (!contIds.includes(coin.id)) {
            if (qty > 0) {
              
              E += Math.ceil(qty / 100) + mod;
            }
          }
        }
      }
      function addIBEdisplay(html, P, E) {
        let weaponEl = html.find(`#weapons .category-name`)[0];
        weaponEl.innerHTML = `${weaponEl.innerText} &nbsp &nbsp &nbsp P: ${P} E: ${E}`;
        
      }

      async function getRate(E, P, table, actor) {
        const mod = (await game.settings.get(OSEIBE.moduleName, 'strMod')) ? actor.system.scores.str.mod : 0;
        let rate;
        
        
        if (E > 9 + mod || P > 16 + mod) {
          return { x: 0, e: 0, o: 0 };
        }
        for (let entry of table) {
          
          if (E <= entry.e + mod && P <= entry.p + mod) {
            
            rate = entry.r;
          }
        }

        return rate;
      }

      async function setRate(E, P, table, actor) {
        const rate = await getRate(E, P, table, actor);
        let exInp = html.find(`input[name="system.movement.base"]`);
        let els = html.find(`li.attribute-secondaries`);
        for (let el of els) {
          if (!el.classList.value.includes('attack')) {
            
            let h4 = el.querySelector(`h4`);
            let dispEl = el.querySelector('div.attribute-value');
            
            if (h4.innerText.includes('Ov')) {
              
              dispEl.innerText = rate.o;
            }
            if (h4.innerText.includes('En')) {
              
              dispEl.innerText = rate.e;
            }
          }
          if(exInp[0]){
            exInp[0].value = rate.x;
          }
        }
      }

      function countBundle(arr, actor) {
        
        let unique = [];
        let wt = 0;
        arr.map(async (i) => {

          const itemObj = await actor.items.get(i);
          let iQty = itemObj.system.quantity.value;
          let split = iQty / 3;
          let fQty = split % 1 ? Math.floor(split) + 1 : split;
          
          wt += fQty;
        });

        return wt;
      }
    }
  });
};
