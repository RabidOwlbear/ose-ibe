import { registerIbe } from './modules/ibe.js'
window.OSEIBE = {
  moduleName: 'ose-ibe',
}
Hooks.once('init', async  ()=>{
  console.log('initializing IBE')
  registerIbe()
  
  game.settings.register(OSEIBE.moduleName, 'strMod', {
    name: 'Use optional STR modifier rule.',
    hint: 'Adds STR mod to packed item maximum, Increases item carry allowance per movement band.',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  })
})