// "Every great game begins with a single scene. Let's make this one unforgettable!"
export class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    preload() {
        // Load assets tải ảnh lên
        this.load.image('background', 'assets/images/background.png');
        this.load.image('startbackground', 'assets/images/startbackground.png');
        this.load.image('error', 'assets/images/error.png');
        this.load.image('overscene', 'assets/images/overscene.png');
        this.load.image('nextgame', 'assets/images/nextgame.png');
        this.load.image('next', 'assets/images/next.png');
        this.load.image('basket', 'assets/images/basket.png');
        this.load.atlas('Subjects','assets/spritesheets/Subjects.png','assets/spritesheets/subject_spritesheet.json');
        this.load.audio('pop', 'assets/audio/pop.mp3');
        this.load.audio('xtremefreddy-game-music-loop-5-144569', 'assets/audio/xtremefreddy-game-music-loop-5-144569.mp3');
    }


    create() {
        
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'startbackground')
            .setDisplaySize(this.scale.width, this.scale.height);
        // add in text

        this.add.text(this.scale.width / 2 - 5, this.scale.height / 2 - 65, 'Đăng nhập', {
            fontFamily: 'Arial', // Use the custom font
            fontSize: '60px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.cameras.main.fadeOut(500);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('CountdownScene');
            });
        });

        this.cameras.main.fadeIn(500);
        this.sound.play('xtremefreddy-game-music-loop-5-144569', {
            volume: 0.5,
            loop: true
        });
    }

}
