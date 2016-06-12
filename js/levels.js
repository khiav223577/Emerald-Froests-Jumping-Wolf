function createLevelController(BASE_Y){
  var levels = [], difficulty = 0;
  return {
    update: function(player){
      if (levels[0] == undefined){
        (function(){
          difficulty += 1;
          var sx = player.attrs.x + 100;  
          switch(difficulty){
          case 1: {
            var emys = [
              {hp: 100, atk: 100, path: 'images/characters/monster-01.png'},
              {hp: 100, atk: 100, path: 'images/characters/monster-02.png'},
              {hp: 100, atk: 100, path: 'images/characters/monster-03.png'},
            ];
            _.times(10, function(s){
              sx += 500 + Math.rand(300);
              levels.push({position: sx, emyAttrs: _.sample(emys, 1)});
            });
            break;}
          case 2: {
            var emys = [
              {hp: 100, atk: 100, path: 'images/characters/monster-01.png'},
              {hp: 100, atk: 100, path: 'images/characters/monster-02.png'},
              {hp: 100, atk: 100, path: 'images/characters/monster-03.png'},
            ];
            _.times(10, function(s){
              sx += 500 + Math.rand(300);
              levels.push({position: sx, emyAttrs: _.sample(emys, 2)});
            });
            break;}
          default: {
            var emys = [
              {hp: 100, atk: 100, path: 'images/characters/monster-01.png'},
              {hp: 100, atk: 100, path: 'images/characters/monster-02.png'},
              {hp: 100, atk: 100, path: 'images/characters/monster-03.png'},
            ];
            _.times(10, function(s){
              sx += 500 + Math.rand(300);
              levels.push({position: sx, emyAttrs: _.sample(emys, 3)});
            });
            break;}
          }
          levels.push({position: sx + 2000, emyAttrs: []}); //the break time when player change difficulty
        })();
      }
      var level = levels[0];
      if (level && level.position < player.attrs.x + 1000){
        levels.shift();
        var x = level.position;
        _.each(level.emyAttrs, function(attr){
          ;(function(){
            var animator = new SpringAnimator(0, 20, 0.3, 800, function(y){ character.attrs.y = y; });
            var character = characterFoctory.create(attr.path, {
              x: x, 
              y: BASE_Y, 
              scale: 0.5,
              hp: attr.hp,
              atk: attr.atk
            }, function(thisObj){
              animator.update();
            });
            ;(function bounce(){
              animator.setVal(BASE_Y + 40, function(){
                animator.setVal(BASE_Y, function(){
                  bounce();
                });
              });
            })();
          })();
          x += 80 + Math.rand(50);
        });
      }
    }
  };
}
