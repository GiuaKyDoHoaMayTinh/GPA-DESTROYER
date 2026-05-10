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
        // Hiển thị background khác tuỳ theo kết quả
        const backgroundKey = this.isWin ? 'nextgame' : 'overscene';
        this.add.image(10, -50, backgroundKey).setOrigin(0, 0);
        this.sound.stopAll();
        this.sound.play(this.isWin ? 'win' : 'lose', { volume: 0.7 });
        
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

        const hubEmbed = typeof window !== 'undefined' && window.location.search.includes('hub=1');

        this.input.once('pointerdown', () => {
            this.sound.stopAll();
        this.sound.play('xtremefreddy-game-music-loop-5-144569', { loop: true, volume: 0.5 });
            if (hubEmbed && window.parent !== window) {
                if (!this.isWin) {
                    this.cameras.main.fadeOut(400);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                        this.scene.start('GameScene');
                    });
                    return;
                }
                window.parent.postMessage(
                    { type: 'gpaGame1Exit', score: this.score, isWin: true },
                    '*'
                );
                return;
            }
            this.cameras.main.fadeOut(500);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('GameScene');
            });
        });

        // Khung ESC chỉ hiện khi thua
        if (!this.isWin) {
            const escBoxWidth = 280;
            const escBoxHeight = 60;
            const escBoxX = this.scale.width - escBoxWidth - 20;
            const escBoxY = 20;

            const escBg = this.add.graphics();
            escBg.fillStyle(0x000000, 0.5);
            escBg.fillRoundedRect(escBoxX, escBoxY, escBoxWidth, escBoxHeight, 20);
            escBg.lineStyle(2, 0xffffff, 0.3);
            escBg.strokeRoundedRect(escBoxX, escBoxY, escBoxWidth, escBoxHeight, 20);

            this.add.text(
                escBoxX + escBoxWidth / 2,
                escBoxY + escBoxHeight / 2,
                'Nhấn ESC để thoát game',
                {
                    fontFamily: 'Arial',
                    fontSize: '20px',
                    fontStyle: 'bold',
                    color: '#ffffff',
                    align: 'center'
                }
            ).setOrigin(0.5);
        }

        this.cameras.main.fadeIn(500);
    }

}
 