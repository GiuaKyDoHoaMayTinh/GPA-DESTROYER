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

        // Khung đen bo tròn ở giữa màn hình
        const boxWidth = 800;
        const boxHeight = 160;
        const boxX = this.scale.width / 2 - boxWidth / 2;
        const boxY = this.scale.height / 2 - boxHeight / 2;

        const instructionBg = this.add.graphics(); // Dùng Graphics để vẽ khung đen bo tròn
        instructionBg.fillStyle(0x000000, 0.8); // Màu đen với độ mờ 80%
        instructionBg.fillRoundedRect(boxX, boxY, boxWidth, boxHeight, 30); // Vẽ hình chữ nhật bo tròn
        instructionBg.lineStyle(2, 0xffffff, 0.3); // Viền trắng mờ
        instructionBg.strokeRoundedRect(boxX, boxY, boxWidth, boxHeight, 30); // Vẽ viền cho khung

        // 2 dòng chữ căn giữa khung
        const instructionText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            'Sử dụng ⬅ ➡ để di chuyển thanh hứng',
            {
                fontFamily: 'Arial',
                fontSize: '40px',
                fontStyle: 'bold',
                color: '#ffffff',
                align: 'center',
                lineSpacing: 12
            }
        ).setOrigin(0.5);

        // Ẩn cả khung lẫn chữ sau 5 giây
        this.time.delayedCall(5000, () => {
            instructionBg.destroy();
            instructionText.destroy();
        });

        // Số đếm ngược ở giữa màn hình
        const countText = this.add.text(this.scale.width / 2, this.scale.height / 2, '5', {
            fontFamily: 'Arial',
            fontSize: '200px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 10
        }).setOrigin(0.5).setVisible(false); // Ban đầu ẩn số đếm ngược;

        // Đợi 5 giây (hướng dẫn hiện xong) rồi mới bắt đầu đếm ngược
        this.time.delayedCall(5000, () => {
            countText.setVisible(true); // Hiện số đếm ngược

            let count = 5;
            this.time.addEvent({
                delay: 1000,
                repeat: 4,
                callback: () => {
                    count--;
                    if (count > 0) {
                        countText.setText(count.toString());
                        this.tweens.add({
                            targets: countText,
                            scaleX: 1.3,
                            scaleY: 1.3,
                            duration: 100,
                            yoyo: true,
                        });
                    } else {
                        countText.destroy();
                        this.cameras.main.fadeOut(300);
                        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                            this.scene.start('GameScene');
                        });
                    }
                }
            });
        });

        // Khung ESC góc trên bên phải — hiện xuyên suốt, không bị xóa
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

        this.cameras.main.fadeIn(300);
    }
}