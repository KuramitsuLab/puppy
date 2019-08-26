window['PuppyVMCode'] = {
  world: {
    'width': 1000,
    'height': 1000,
    'mouse': true,
  },
  main: function* (Matter, puppy) {
    yield puppy.vars['A'] = puppy.newMatter({ shape: 'rectangle', position: { x: 500, y: 1000 }, width: 1000, isStatic: true })
    puppy.vars['blocks'] = [];
    puppy.vars['Blocks'] = class extends puppy.vars['Rectangle']{
      width = 80;
      height = 50;
    };
    for(let x of [100, 200, 300, 400]){
      for(let y of [100, 200, 300, 400]){
        yield puppy.vars['blocks'].push(puppy.newMatter(new puppy.vars['Blocks'](x, y)));
      }
    }
  }
}