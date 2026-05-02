export class CountdownScene extends Phaser.Scene {
    constructor() {
        super('CountdownScene');
    }

    create() {
        // Hiển thị background game
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'background')
            .setDisplaySize(this.scale.width, this.scale.height);

        // Vẽ lại UI môn học giống hệt GameScene
        const subjectNames = ['Đồ họa', 'Học máy', 'Kinh tế', 'Hình họa', 'Thẩm mỹ'];
        const subjectColors = [0x79B4B0, 0xC6878F, 0x9794D1, 0xCC6733, 0xB2C19E];
        const creditCounts = [5, 4, 2, 3, 4];
        const startX = 80;
        const startY = 330;
        const lineHeight = 80;

        subjectNames.forEach((name, index) => {
            // Ô màu
            this.add.rectangle(startX - 40, startY + index * lineHeight + 20, 20, 20, subjectColors[index]); // Square màu đại diện cho môn học 
            // Tên môn
            this.add.text(startX, startY + index * lineHeight, name, {
                fontFamily: 'Arial',
                fontSize: '35px',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            });
            // Các ô tín chỉ rỗng
            const creditBoxStartX = startX + 180;
            for (let i = 0; i < creditCounts[index]; i++) {
                this.add.rectangle(creditBoxStartX + i * 35 + 10, startY + index * lineHeight + 20, 30, 30)
                    .setFillStyle(0xffffff, 0)
                    .setStrokeStyle(2, subjectColors[index]);
            }
        });

        // Hiển thị thời gian đứng yên ở vị trí giống GameScene
        this.add.text(150, this.scale.height - 250, '40', {
            fontSize: '150px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#1256b5',
            stroke: '#ffffff',
            strokeThickness: 6
        });

        // Số đếm ngược ở giữa màn hình
        const countText = this.add.text(this.scale.width / 2, this.scale.height / 2, '5', {
            fontFamily: 'Arial',
            fontSize: '200px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 10
        }).setOrigin(0.5);

        // Đếm ngược từ 5 xuống 1 rồi start GameScene
        let count = 5;
        this.time.addEvent({
            delay: 1000,
            repeat: 4,
            callback: () => {
                count--;
                if (count > 0) {
                    countText.setText(count.toString());
                    // Hiệu ứng phóng to rồi thu nhỏ
                    this.tweens.add({
                        targets: countText,
                        scaleX: 1.3,
                        scaleY: 1.3,
                        duration: 100,
                        yoyo: true,
                    });
                } else {
                    // Đếm xong, chuyển sang GameScene
                    countText.destroy();
                    this.cameras.main.fadeOut(300);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                        this.scene.start('GameScene');
                    });
                }
            }
        });

        this.cameras.main.fadeIn(300);
    }
}