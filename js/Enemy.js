import {random} from './util.js'

export default class Enemy {
    constructor(context, spawnY = -140) {
        this.context = context;
        this.positions = [36,136,236,336];

        this.x = this.positions[random(0,4)];
        this.y = spawnY;

        this.asset = new Image();
        this.asset.src = './assets/green.png'

        this.velocity = 10;

        this.height = 138;
        this.width = 70;
    }

    reset(spawnY = -140){
        this.x = this.positions[random(0,4)];
        this.y = spawnY;
    }

    show() {
        this.context.drawImage(this.asset, this.x, this.y);
    }

   update(){
       this.y += this.velocity;
   }

   die(){
       if(this.y > 900 + 200){
           return true;
       }
   }
}
