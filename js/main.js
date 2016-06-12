$(function(){
  var canvas = $('#game_canvas')[0];
  var ctx = canvas.getContext("2d");
  sceneManager.goto(new MenuScene()); //first scene //TODO game menu scene
  ;(function(fps){
    var interval = 1000 / fps;
    var prevTime = Date.now();
    ;(function loop(){
      window.requestAnimFrame(loop);
      var now = Date.now();
      var delta = now - prevTime;
      if (delta < interval) return;
      var deltaRatio = delta / interval; //經過的時間與預計的時間的比例。數字越高代表越LAG。
      prevTime += delta - (delta % interval); //若requestAnimFrame是60FPS時，delta會是16ms的倍數。要減掉delta % interval否則會多算時間。
      Input.update();
      sceneManager.update(deltaRatio);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sceneManager.render(canvas);
    })();
  }(40));
});
//-------------------------------------
//  MenuScene
//-------------------------------------
function MenuScene(){
  return {
    update: function(deltaRatio){
      if (Input.pressed(Input.KEYS.ENTER)){
        //TODO sound && animation?
        sceneManager.goto(new MapScene());
      } 
    },
    render: function(canvas){
      var ctx = canvas.getContext("2d");
      imageCacher.ifloaded('images/menu.jpg', function(image){
        var width = image.width * (canvas.height / image.height);
        ctx.drawImage(image, (canvas.width - width) / 2, 0, width, canvas.height);  
      });
    }
  };
}
//-------------------------------------
//  MapScene
//-------------------------------------
function MapScene(){
  var VIEWPORT_X = 90; //視角讓狼固定在的X位置
  var BASE_Y = 80;     //地面高度
//-------------------------------------
//  player
//-------------------------------------
  var player = (function(){
    var vx = 0, vy = 0;
    return characterFoctory.create('images/characters/wolf.png', {
      x: 0, 
      y: BASE_Y,
      hp: 100,
      atk: 100
    }, function(){
      if (Input.pressed(Input.KEYS.RIGHT)) vx = 6;
      else if (Input.pressed(Input.KEYS.LEFT)) vx = 3;
      else vx = 4;
      if (Input.pressed(Input.KEYS.UP) && player.attrs.y == BASE_Y) vy = 15;
      if (player.attrs.y > BASE_Y){
        vy -= 1; //gravity
      }
      player.attrs.x += vx;
      player.attrs.y += vy;
      if (player.attrs.y < BASE_Y){
        player.attrs.y = BASE_Y;
        vy = 0;
      }
    });
  })();
//-------------------------------------
//  enemy
//-------------------------------------
  var enemyRespawnController = new function(){
    var levels = [], difficulty = 0;
    return {
      update: function(){
        if (levels[0] == undefined){
          (function(){
            difficulty += 1;
            switch(difficulty){
            case 1: {
              var emy1 = {hp: 100, atk: 100, path: 'images/characters/monster-01.png'};
              levels.push({position: player.attrs.x + 1000, emyAttrs: [emy1]});
              levels.push({position: player.attrs.x + 2000, emyAttrs: [emy1]});
              levels.push({position: player.attrs.x + 3000, emyAttrs: [emy1]});
              levels.push({position: player.attrs.x + 4000, emyAttrs: []});
              break;}
            case 2: {
              levels.push({position: player.attrs.x + 1100, emyAttrs: [{hp: 100, atk: 100, path: 'images/characters/monster-01.png'}]});
              break;}
            case 3: {
              levels.push({position: player.attrs.x + 1100, emyAttrs: [{hp: 100, atk: 100, path: 'images/characters/monster-01.png'}]});
              break;}
            default: {
              levels.push({position: player.attrs.x + 1100, emyAttrs: [{hp: 100, atk: 100, path: 'images/characters/monster-01.png'}]});
              break;}
            }
          })();
        }
        var level = levels[0];
        if (level && level.position < player.attrs.x + 1000){
          levels.shift();
          _.each(level.emyAttrs, function(attr){
            characterFoctory.create(attr.path, {
              x: level.position, 
              y: BASE_Y, 
              scale: 0.5,
              hp: attr.hp,
              atk: attr.atk
            });
          });
        }
      }
    };
  };
  return {
    update: function(deltaRatio){
      enemyRespawnController.update();
      _.each(characterFoctory.characters, function(character){
        character.update();
      });
    },
    render: function(canvas){
      var ctx = canvas.getContext("2d");
      var viewX = player.attrs.x - VIEWPORT_X;
      function drawImageWithXRepeat(ratio, path){
        imageCacher.ifloaded(path, function(image){
          var width = image.width * (canvas.height / image.height);
          var dx = -(viewX * ratio) % width;
          if (dx > 0) dx -= width;
          while(dx < canvas.width){
            ctx.drawImage(image, dx, 0, width, canvas.height);  
            dx += width;
          }
        });
      }
      drawImageWithXRepeat(0.1, 'images/background.jpg');
      drawImageWithXRepeat(1.0, 'images/ground.png');
      _.each(characterFoctory.characters, function(character){
        character.ifLoaded(function(image){
          var x = character.attrs.x - viewX;
          var y = canvas.height - character.attrs.y - image.height;
          var sx = character.getPattern() / character.maxPattern * image.width;
          var sy = 0;
          var width = image.width / character.maxPattern;
          var height = image.height;
          ctx.drawImage(image, sx, sy, width, height, x, y, width, height);
        });
      });
    }
  };
}
//-------------------------------------
//  Character
//-------------------------------------
var characterFoctory = new function(){
  var MAX_PATTERNS = {
    "images/characters/wolf.png": 4,
    "images/characters/enemy.png": 4,
    "images/characters/monster-01.png": 1,
    "images/characters/monster-02.png": 1,
    "images/characters/monster-03.png": 1
  };
  function getMaxPattern(path){ return MAX_PATTERNS[path] || 1; }
  var characters = {}, counter = 0;
  return {
    characters: characters,
    create: function(path, attrs, preUpdateFunc){
      var cid = (counter += 1);
      var isDead = false;
      var pattern = 0, patternCounter = 0, patternAnimeSpeed = 12;
      function dead(){
        isDead = true;
        //TODO 死亡動畫
        destroy();
      }
      function destroy(){
        delete characters[cid];
      }
      var character = {
        attrs: attrs,
        ifLoaded: function(callback){
          imageCacher.ifloaded(path, function(image){
            if (attrs.scale == undefined || attrs.scale == 1){
              callback(image);  
            }else{
              callback(imageCacher.loadBy(path + '=> scaled', function(){ 
                var width = Math.floor(image.width * attrs.scale);
                var height = Math.floor(image.height * attrs.scale);
                return (new FilterableImage(image, width, height).getCanvas()); 
              }));
            }
          });
        },
        getPattern: function(){ return pattern; },
        maxPattern: getMaxPattern(path),
        update: function(){
          if (preUpdateFunc) preUpdateFunc();
          patternCounter += patternAnimeSpeed;
          if (patternCounter > 100){
            patternCounter -= 100;
            pattern = (pattern + 1) % character.maxPattern;
          }
        },
        damage: function(damage){
          attrs.hp -= damage;
          if (attrs.hp < 0 && isDead == false) dead();
        },
      };
      return characters[cid] = character;
    }
  }
}









