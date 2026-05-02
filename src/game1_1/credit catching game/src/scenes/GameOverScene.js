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

        this.cameras.main.fadeIn(500);

        if (typeof window.GPA_SCORE !== 'undefined' && typeof window.GPA_SCORE.postScore === 'function') {
            window.GPA_SCORE.postScore('game1_1', this.score, { win: this.isWin }).catch(function (err) {
                console.warn('[GPA_SCORE] game1_1:', err && err.message ? err.message : err);
            });
        }
    }

}
 