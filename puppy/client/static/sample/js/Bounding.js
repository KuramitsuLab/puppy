window['PuppyVMCode'] = {
  world: {
    'width': 1000,
    'height': 1000,
    'mouse': true,
  },
  main: function* (Matter, puppy) {
    yield puppy.vars['A'] = puppy.newMatter({ shape: 'rectangle', position: { x: 500, y: 1000 }, width: 1000, isStatic: true })
    yield puppy.vars['B'] = puppy.newMatter({ shape: 'label', position: { x: 60, y: 50 }, value: 0 })
    const count = (x, y) => { puppy.vars['B'].value += 1 };
    yield puppy.vars['C'] = puppy.newMatter({ shape: 'circle', position: { x: 500, y: 500 }, collisionStart: count, restitution: 1, width: 100 })
  }
}