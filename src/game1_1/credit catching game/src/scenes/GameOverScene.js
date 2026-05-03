// "Every great game begins with a single scene. Let's make this one unforgettable!"
export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        // Nhận dữ liệu từ GameScene
        this.isWin = data.isWin || false;
        this.score = data.score || 0;
    }

    create() {
         // Dừng nhạc nền, phát âm thanh thắng/thua
        this.sound.stopAll();
        if (this.isWin) {
            this.sound.play('win', { volume: 0.8 });
        } else {
            this.sound.play('lose', { volume: 0.8 });
        }

        // Hiển thị background khác tuỳ theo kết quả
        const backgroundKey = this.isWin ? 'nextgame' : 'overscene';
        this.add.image(10, -50, backgroundKey).setOrigin(0, 0);
        
        // add in text or image button
        if (this.isWin) {
            this.add.text(this.scale.width / 2 + 10, this.scale.height / 2 + 100, 'Điểm: ' + this.score, {
                fontSize: '100px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 8
            }).setOrigin(0.5);
            this.add.image(this.scale.width / 2 + 10, this.scale.height / 2 + 270, 'next')
                .setOrigin(0.5)
                .setScale(1.5); // Nút "Next" lớn hơn và nổi bật hơn
        } else {
            this.add.text(this.scale.width / 2 + 10, this.scale.height / 2 + 140, 'Chơi lại', {
                fontSize: '80px',
                fontfamily: 'Arial',
                fontStyle: 'bold',
                color: '#ffffff',
            }).setOrigin(0.5);
        }

        this.input.once('pointerdown', () => {
            this.cameras.main.fadeOut(500);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.sound.stopAll(); // dừng win/lose trước
                this.sound.play('xtremefreddy-game-music-loop-5-144569', {
                    volume: 0.3,
                    loop: true
                });
                this.scene.start('GameScene');
            });
        });

        this.cameras.main.fadeIn(500);
    }

}
 
