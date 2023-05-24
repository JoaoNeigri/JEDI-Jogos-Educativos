class Fase_3 extends Phaser.Scene {


    // função para carregamento de assets
    preload ()
    {
        this.load.spritesheet('player_sp', "assets/spritesheets/player_sp.png", { frameWidth: 64, frameHeight: 64 });

        this.load.image('tiles', "assets/maps/maptiles.png");
        
        this.load.tilemapTiledJSON("map", "assets/maps/mapa2.json");

        this.load.spritesheet("spider_sp", "assets/spritesheets/spider11.png", {
            frameWidth: 64,
            frameHeight: 64,
          });
    }
    

    // função para criação dos elementos
    create ()
    {

        this.map = this.make.tilemap({ key: 'map', tileWidth: 16, tileHeight: 16 });
        this.tileset = this.map.addTilesetImage('maptiles', 'tiles');


        this.wallsLayer = this.map.createDynamicLayer('ground', this.tileset, 0, 0);
        this.wallsLayer = this.map.createDynamicLayer('colision', this.tileset, 0, 0);
        this.groundLayer = this.map.createDynamicLayer('walls', this.tileset, 0, 0);

        // criação jogador
        this.player = new player(this, 280, 620, 'player_sp', 0);
        this.player.setScale(0.4);
        this.player.has_bow = false;    // previne de atirar flechas

        this.mago =  this.physics.add.sprite(270, 250, 'player_sp', 29);
        this.mago.setScale(0.4);


        // criação da colisão com camadas
        this.wallsLayer.setCollisionBetween(0,1000, true)
        this.physics.add.collider(this.player, this.wallsLayer);

        // ligação das teclas de movimento
        this.keyA = this.input.keyboard.addKey('A');
        this.keyD = this.input.keyboard.addKey('D');
        this.keyW = this.input.keyboard.addKey('W');
        this.keyS = this.input.keyboard.addKey('S');
        this.keySPACE = this.input.keyboard.addKey('SPACE');

        this.keyE = this.input.keyboard.addKey('E');

        // definição de zoom da câmera e comando para seguir jogador
        this.cameras.main.setZoom(1.5);
        this.cameras.main.startFollow(this.player, true, 0.2, 0.2)

        // criação da zona
        this.zone_dlg = this.add.zone(270, 250).setSize(100, 100);
        this.physics.world.enable(this.zone_dlg);
        this.physics.add.overlap(this.player, this.zone_dlg);

        this.zone_ques = this.add.zone(270, 450).setSize(100, 100);
        this.physics.world.enable(this.zone_ques);
        this.physics.add.overlap(this.player, this.zone_ques);

        // criação da mensagem "pressione E para interagir"
        var px = this.cameras.main.width*0.35;  // pos horizontal
        var py = 2*this.cameras.main.height/3;  // pos vertical
        console.log('pp', px, py)
        this.interact_txt = this.add.text(px, py, "Pressione E para interagir", {
            font: "15px Arial",
            fill: "#A0A0A0",
            align: "center", 
            stroke: '#000000',
            strokeThickness: 4,
        });
        this.interact_txt.setScrollFactor(0);  // deixa em posição relativa à camera (e não ao mapa)
        this.interact_txt.setVisible(false);   // deixa invisível

        // criação de lista de textos (diálogs) e do objeto dialog
        this.txtLst_0 = ["Zé: Oque oce ta fazendo aqui, uai\n","Você: QUERO ASSASSINAR TODOS OS ZUMBIS A SANGUE FRIO, PORÉM MINHA QUADRADA NÃO ESTA DANDO CONTA ", "Zé: Eu tenho exatamente oque oce procura, a ESCOPETA LÓGICA, uai", "Você: PERFEITO >=)"];
        this.txtLst_1 = ["Zé: Você agora tem oque é necessário."];

        this.quest_0 =  ["Jogar baralho é uma atividade que estimula o raciocínio. Um jogo tradicional é a Paciência, que utiliza 52 cartas. Inicialmente são formadas sete colunas com as cartas. A primeira coluna tem uma carta, a segunda tem duas cartas,w e assim sucessivamente até a sétima coluna, a qual tem sete cartas, e o que sobra forma o monte, que são as cartas não utilizadas nas colunas.\nA quantidade de cartas que forma o monte é",
        1, "◯ 21 cartas", "◯ 24 cartas",  "◯ 26 cartas",  "◯ 28 cartas"]
  
        
        this.firstDialog = true;
        this.dialogs = new dialogs(this);   
        

        // flag para responder uma única vez à tecla pressionada
        this.spacePressed = false;

        this.spawn_timer = this.time.addEvent({ delay: Phaser.Math.Between(1000, 3000), callback: spawn, callbackScope: this });
        this.spiders = this.physics.add.group();
        this.spiders.enableBody = true;
        this.spiders.physicsBodyType = Phaser.Physics.ARCADE;
        for (var i = 0; i < 5; i++){
            var spider = this.spiders.create(-10, -10, 'spider_sp');
            spider.setScale(0.7);
            spider.body.setSize(10, 10);
            spider.setActive(false);
            spider.setVisible(false);
        }    
    }


    // update é chamada a cada novo quadro
    update ()
    {
        // verifica e trata se jogador em zona ativa
        this.checkActiveZone();

        // verifica se precisa avançar no diálogo
        if (this.dialogs.isActive && !this.spacePressed && this.keySPACE.isDown){
            this.dialogs.nextDlg();
            this.spacePressed = true;   // seta flag para false para esperar a tecla espaço ser levantada
        }
        // se tecla solta, limpa a flag
        if (!this.keySPACE.isDown){
            this.spacePressed = false;
        }

        for (let spider of this.spiders.getMatching('active', true)){
            spider.setRotation(Math.atan2(this.player.x-spider.x, -this.player.y+spider.y))
        }
    }

    // trata zona ativa
    checkActiveZone(){
        // se jogador dentro de zona e o diálogo não está ativo
        if (this.player.body.embedded && !this.dialogs.isActive){
            // mostra a mensagem e verifica a tecla pressionada
            this.interact_txt.setVisible(true);
            if (this.keyE.isDown){
                this.startDialogOrQuestion();
            } 
        }
        // se diálogo ativo ou fora da zona, esconde a msg
        else{
            this.interact_txt.setVisible(false);
        }
    }
    startDialogOrQuestion(){
        if (this.physics.overlap(this.player, this.zone_dlg)){
            if (this.firstDialog){
                this.dialogs.updateDlgBox(this.txtLst_0);
                this.firstDialog = false;
            }
            else{
                this.dialogs.updateDlgBox(this.txtLst_1);
            }
        }
        if (this.physics.overlap(this.player, this.zone_ques)){
            this.dialogs.scene.dialogs.makeQuestion(this.quest_0, acertou_fcn, errou_fcn);
        }
    }

    checkSwingOverlap(){
        for (let spider of this.spiders.getMatching('active', true)){
            if (Phaser.Geom.Rectangle.Overlaps(spider.getBounds(), this.player.swing.getBounds())){
                console.log('overl')
                spider.setActive(false);
                spider.setVisible(false);
            }
        }
    }

}

function acertou_fcn(ptr){
    console.log("acertou");
    this.dialogs.hideBox();
}

function errou_fcn(ptr){
    console.log("errou")
    this.dialogs.hideBox();
}

function spawn(){
    if (Phaser.Geom.Rectangle.Overlaps(this.zone_spider.getBounds(), this.player.getBounds())){
        console.log('spawn');
        var spider = this.spiders.getFirstDead(false);
        if (spider){    
            spider.body.reset(this.player.x, this.player.y);
            spider.setActive(true);
            spider.setVisible(true);
        }
    
    }
    this.spawn_timer = this.time.addEvent({ delay: Phaser.Math.Between(1000, 3000), callback: spawn, callbackScope: this });
}
