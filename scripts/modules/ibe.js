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
  Hooks.on('renderOseActorSheet', async (actor, html) => {
    const actorObj = actor.object;

    if (actorObj.type == 'character') {
      let P = 0;
      let E = 0;
      let pItems = [];
      let aCont = actorObj.items.filter((i) => i.type === 'container');
      let containerItemIds = [];
      for (let cont of aCont) {
        let contItems = cont.data.data.itemIds;
        contItems.map((i) => containerItemIds.push(i.id));
        let items = contItems.filter((i) =>
          i.data.data.manualTags?.find((t) => t.title.includes('bundle-'))
            ? false
            : i.data.data.manualTags?.find((t) => t.title.includes('Currency'))
            ? false
            : true
        );
        
        let bundles = contItems.filter((i) =>
          i.data.data.manualTags?.find((t) => t.title.includes('bundle-')) ? true : false
        );
        P += countBundle(bundles);

        items.forEach((i) => {
          P += i.data.data.weight ? i.data.data.weight : 0;
        });

        // splitCoins('p', contItems)
      }
      let aItems = actorObj.items
        .filter((i) => i.type === 'item' && !containerItemIds.includes(i.id) && i.data)
        .filter((i) => (i.data.data.manualTags?.find((t) => t.title === 'Currency') ? false : true));
      E += aItems.length;
      
      const weapons = actorObj.items.filter((i) => i.type === 'weapon');
      let eWeap = weapons.filter((w) => w.data.data.equipped);
      E += eWeap.length;
      P += weapons.length - eWeap.length;
      
      const armor = actorObj.items.filter((i) => i.type === 'armor');
      let eArmor = armor.filter((a) => a.data.data.equipped);
      E += eArmor.length;
      P += armor.length - eArmor.length;
      
      
      let table = OSEIBE.data.table;
      splitCoins('e', actorObj.items, containerItemIds);

      await setRate(E, P, table, actorObj);

      addIBEdisplay(html, P, E);

      function splitCoins(type, items, contIds) {
        
        const coins = items.filter((i) => i.data.data.manualTags?.find((t) => t.title === 'Currency'));
        
        for (let coin of coins) {
          let qty = coin.data.data.quantity.value;
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
        const mod = (await game.settings.get(OSEIBE.moduleName, 'strMod')) ? actor.data.data.scores.str.mod : 0;
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
        
        let exInp = html.find(`input[name="data.movement.base"]`);
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
          
          exInp[0].value = rate.x;
          
        }
      }

      function countBundle(arr) {
        
        let unique = [];
        let wt = 0;
        arr.map((i) => {
          let iQty = i.data.data.quantity.value;
          let split = iQty / 3;
          let fQty = split % 1 ? Math.floor(split) + 1 : split;
          
          wt += fQty;
        });

        return wt;
      }
    }
  });
};
