// "Every great game begins with a single scene. Let's make this one unforgettable!"
export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'background')
            .setDisplaySize(this.scale.width, this.scale.height);

        const subjectNames = ['Đồ họa', 'Học máy', 'Kinh tế', 'Hình họa', 'Thẩm mỹ'];
        const subjectColors = [0x72C4C1, 0xC27C7E, 0x9897CC, 0xD14E9F, 0xAFC289];
        const subjectFrames = ['bong1.png', 'bong2.png', 'bong3.png', 'bong4.png', 'bong5.png'];
        const creditCounts = [5, 4, 2, 3, 4];
        const startX = 80;
        const startY = 330;
        const lineHeight = 80;

        this.subjectBallCount = [0, 0, 0, 0, 0];
        this.subjectSpawnRemaining = creditCounts.map(count => count * 2 + 5);
        this.creditBoxes = [];
        this.subjectFrameNames = subjectFrames;
        this.subjectColors = subjectColors;
        this.wifiMissed = false;
        this.creditCounts = creditCounts;
        this.score = 80; // Điểm có sẵn khi thắng
        this.bonusScore = 0; // Điểm cộng thêm từ bóng thưởng

        subjectNames.forEach((name, index) => {
            this.add.rectangle(startX - 40, startY + index * lineHeight + 20, 20, 20, subjectColors[index]);
            this.add.text(startX, startY + index * lineHeight, name, {
                fontFamily: 'Arial',
                fontSize: '35px',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            });

            const creditBoxStartX = startX + 180;
            const boxes = [];
            for (let i = 0; i < creditCounts[index]; i++) {
                const rect = this.add.rectangle(creditBoxStartX + i * 35 + 10, startY + index * lineHeight + 20, 30, 30)
                    .setFillStyle(0xffffff, 0)
                    .setStrokeStyle(2, subjectColors[index]);
                boxes.push({ rect });
            }
            this.creditBoxes.push(boxes);
        });

        // Dòng "Điểm cộng" hiển thị dưới cột môn học
        const bonusTextY = startY + subjectNames.length * lineHeight + 20;
        this.add.text(startX - 40, bonusTextY, 'Điểm cộng:', {
            fontFamily: 'Arial',
            fontSize: '35px',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.scoreBonusText = this.add.text(startX + 180, bonusTextY + 2, '+0', {
            fontFamily: 'Arial',
            fontSize: '35px',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });

        // Basket
        this.basket = this.physics.add.image(this.scale.width / 2, this.scale.height - 80, 'basket');
        this.basket.body.setAllowGravity(false).setCollideWorldBounds(true);
        this.basketGlow = this.basket.postFX.addGlow(0xffffff, 3, 0);

        this.cursorKeys = this.input.keyboard.createCursorKeys();

        this.subjectsframes = this.textures.get('Subjects').getFrameNames();
        this.subjectgroup = this.physics.add.group([]);
        this.timeBallGroup = this.physics.add.group([]);
        this.wifiBallGroup = this.physics.add.group([]);
        this.bonusBallGroup = this.physics.add.group([]); // Group riêng cho bóng thưởng
        this.timeBallSpawned = 0;
        this.wifiBallSpawned = 0;
        this.bonusBallSpawned = 0;
        this.totalBonusBalls = 7; // Tổng số bóng thưởng sẽ spawn (6-7 quả)

        const totalSubjectBalls = creditCounts.reduce((sum, count) => sum + (count * 2 + 5), 0);
        this.totalWifiBalls = 25;
        this.totalBallsToSpawn = totalSubjectBalls + 5 + this.totalWifiBalls;

        const basketHalfWidth = this.basket.displayWidth * 0.5;
        this.spawnArea = {
            xMin: 500 + basketHalfWidth,
            xMax: this.scale.width - basketHalfWidth,
            y: -20
        };
        this.allowedBounds = {
            xMin: 500 + basketHalfWidth,
            xMax: this.scale.width - basketHalfWidth,
            yMin: -100,
            yMax: this.scale.height
        };

        this.time.addEvent({
            delay: 500,
            loop: true,
            callback: this.spawnBall,
            callbackScope: this,
        });

        // Collision detection
        this.physics.add.overlap(this.basket, this.subjectgroup, this.handlebasketsbCollision, null, this);
        this.physics.add.overlap(this.basket, this.timeBallGroup, this.handleTimeballCollision, null, this);
        this.physics.add.overlap(this.basket, this.wifiBallGroup, this.handleWifiballCollision, null, this);
        // Overlap riêng cho bóng thưởng — không dùng chung với subjectgroup
        this.physics.add.overlap(this.basket, this.bonusBallGroup, this.handleBonusBallCollision, null, this);

        this.timeText = this.add.text(150, this.scale.height - 250, '45', {
            fontSize: '150px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#1256b5',
            stroke: '#ffffff',
            strokeThickness: 6
        });

        this.gameIsOver = false;
        this.timedEvent = this.time.delayedCall(40 * 1000, this.handGameOver, [], this);

        this.cameras.main.fadeIn(500);
    }

    update() {
        if (this.gameIsOver) {
            this.basket.setVelocityX(0);
            return;
        }
        this.timeText.setText(Math.round(this.timedEvent.getRemainingSeconds()).toString());

        if (this.input.keyboard.enabled) {
            if (this.cursorKeys.left.isDown) {
                this.basket.setVelocityX(-700);
            } else if (this.cursorKeys.right.isDown) {
                this.basket.setVelocityX(700);
            } else {
                this.basket.setVelocityX(0);
            }
        } else {
            this.basket.setVelocityX(0);
        }

        const clampedX = Phaser.Math.Clamp(this.basket.x, this.allowedBounds.xMin, this.allowedBounds.xMax);
        if (this.basket.x !== clampedX) {
            this.basket.x = clampedX;
            this.basket.setVelocityX(0);
        }

        this.subjectgroup.getChildren().forEach((child) => {
            if (!child.active) return;
            if (child.y > this.allowedBounds.yMax + 10 ||
                child.y < this.allowedBounds.yMin ||
                child.x < this.allowedBounds.xMin ||
                child.x > this.allowedBounds.xMax) {
                child.setActive(false).setVisible(false);
            }
        });

        this.timeBallGroup.getChildren().forEach((child) => {
            if (!child.active) return;
            if (child.y > this.allowedBounds.yMax + 10 ||
                child.y < this.allowedBounds.yMin ||
                child.x < this.allowedBounds.xMin ||
                child.x > this.allowedBounds.xMax) {
                child.setActive(false).setVisible(false);
            }
        });

        this.wifiBallGroup.getChildren().forEach((child) => {
            if (!child.active) return;
            if (child.y > this.allowedBounds.yMax + 10 ||
                child.y < this.allowedBounds.yMin ||
                child.x < this.allowedBounds.xMin ||
                child.x > this.allowedBounds.xMax) {
                child.setActive(false).setVisible(false);
            }
        });

        // Dọn bóng thưởng ra ngoài vùng
        this.bonusBallGroup.getChildren().forEach((child) => {
            if (!child.active) return;
            if (child.y > this.allowedBounds.yMax + 10 ||
                child.x < this.allowedBounds.xMin ||
                child.x > this.allowedBounds.xMax) {
                child.setActive(false).setVisible(false);
            }
        });
    }

    spawnBall() {
        if (this.gameIsOver) return;

        let remainingSubject = this.subjectSpawnRemaining.reduce((a, b) => a + b, 0);
        let remainingTime = Math.max(0, 5 - this.timeBallSpawned);
        let remainingWifi = Math.max(0, this.totalWifiBalls - this.wifiBallSpawned);
        let remainingBonus = Math.max(0, this.totalBonusBalls - this.bonusBallSpawned);

        if (remainingSubject === 0 && remainingTime === 0 && remainingWifi === 0 && remainingBonus === 0) {
            this.totalWifiBalls++;
            remainingWifi = 1;
        }

        const totalRemaining = remainingSubject + remainingTime + remainingWifi + remainingBonus;
        if (totalRemaining === 0) return;

        const choice = Phaser.Math.RND.between(0, totalRemaining - 1);

        if (choice < remainingSubject) {
            this.spawnRandomsubject();
        } else if (choice < remainingSubject + remainingTime) {
            this.spawnTimeBall();
        } else if (choice < remainingSubject + remainingTime + remainingWifi) {
            this.spawnWifiBall();
        } else {
            this.spawnBonusBall();
        }
    }

    spawnTimeBall() {
        if (this.timeBallSpawned >= 5) return;

        const x = Phaser.Math.RND.between(this.spawnArea.xMin, this.spawnArea.xMax);
        const tb = this.timeBallGroup.getFirstDead(true, x, this.spawnArea.y, 'Subjects');
        if (!tb) return;

        tb.setScale(0.5).setActive(true).setVisible(true)
            .setVelocity(0, 400).setFrame('time.png').enableBody();
        this.timeBallSpawned++;
    }

    spawnWifiBall() {
        if (this.wifiBallSpawned >= this.totalWifiBalls) return;

        const x = Phaser.Math.RND.between(this.spawnArea.xMin, this.spawnArea.xMax);
        const wb = this.wifiBallGroup.getFirstDead(true, x, this.spawnArea.y, 'Subjects');
        if (!wb) return;

        wb.setScale(0.5).setActive(true).setVisible(true)
            .setVelocity(0, 1000).setFrame('wifi.png').enableBody();
        this.wifiBallSpawned++;
    }

    spawnBonusBall() {
        if (this.bonusBallSpawned >= this.totalBonusBalls) return;

        // 3 loại bóng thưởng với điểm tương ứng
        const bonusTypes = [
            { frame: 'cong5.png', value: 5 },
            { frame: 'cong3.png', value: 3 },
            { frame: 'cong2.png', value: 2 },
        ];
        const picked = Phaser.Utils.Array.GetRandom(bonusTypes);
        const x = Phaser.Math.RND.between(this.spawnArea.xMin, this.spawnArea.xMax);

        // Dùng getFirstDead để tái sử dụng object
        const bb = this.bonusBallGroup.getFirstDead(true, x, -20, 'Subjects');
        if (bb) {
            bb.setFrame(picked.frame)
                .setScale(0.5)
                .setActive(true)
                .setVisible(true)
                .setVelocity(0, 350)
                .setData('value', picked.value)
                .enableBody();
            bb.body.setAllowGravity(false);
        } else {
            // Tạo mới nếu chưa có object nào trong pool
            const newBb = this.physics.add.image(x, -20, 'Subjects')
                .setFrame(picked.frame)
                .setScale(0.5)
                .setVelocity(0, 350)
                .setData('value', picked.value);
            newBb.body.setAllowGravity(false);
            this.bonusBallGroup.add(newBb);
        }

        this.bonusBallSpawned++;
    }

    spawnRandomsubject() {
        const availableSubjects = this.subjectSpawnRemaining
            .map((remaining, index) => ({ remaining, index }))
            .filter(item => item.remaining > 0);

        if (availableSubjects.length === 0) return;

        const choice = Phaser.Utils.Array.GetRandom(availableSubjects);
        const x = Phaser.Math.RND.between(this.spawnArea.xMin, this.spawnArea.xMax);
        const sb = this.subjectgroup.getFirstDead(true, x, this.spawnArea.y, 'Subjects');
        if (!sb) return;

        sb.setScale(0.5).setActive(true).setVisible(true)
            .setVelocity(0, 400)
            .setFrame(this.subjectFrameNames[choice.index])
            .enableBody();
        this.subjectSpawnRemaining[choice.index]--;
    }

    handlebasketsbCollision(basket, sb) {
        // Quan trọng: bỏ qua nếu là bóng thưởng, để handleBonusBallCollision xử lý
        if (this.bonusBallGroup.contains(sb)) return;

        const frameName = sb.frame.name;
        const subjectIndex = this.subjectFrameNames.indexOf(frameName);
        sb.disableBody(true, true);
        if (this.gameIsOver) return;

        if (subjectIndex !== -1) {
            const subjectMax = this.creditBoxes[subjectIndex].length * 2;
            if (this.subjectBallCount[subjectIndex] < subjectMax) {
                this.subjectBallCount[subjectIndex]++;
                const caught = this.subjectBallCount[subjectIndex];
                if (caught % 2 === 0) {
                    const boxIndex = caught / 2 - 1;
                    const box = this.creditBoxes[subjectIndex][boxIndex];
                    if (box) {
                        box.rect.setFillStyle(this.subjectColors[subjectIndex], 1);
                        box.rect.setStrokeStyle(2, this.subjectColors[subjectIndex]);
                    }
                }
            }

            const allCreditsFilled = this.subjectBallCount.every((count, index) => count >= this.creditBoxes[index].length * 2);
            if (allCreditsFilled) {
                this.finishGame(true);
            }
        }
    }

    handleBonusBallCollision(basket, bb) {
        if (this.gameIsOver) return;
        const value = bb.getData('value');
        bb.disableBody(true, true);

        // Cộng điểm thưởng
        this.bonusScore += value;
        this.score = 80 + this.bonusScore;

        // Cập nhật text điểm cộng
        this.scoreBonusText.setText('+' + this.bonusScore);

        // Text nổi lên rồi mờ dần
        const floatText = this.add.text(basket.x, basket.y - 40, `+${value}`, {
            fontFamily: 'Arial',
            fontSize: '60px',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatText,
            y: basket.y - 150,
            alpha: 0,
            duration: 1000,
            onComplete: () => floatText.destroy()
        });

        this.sound.play('pop', { volume: 0.5 });
    }

    handleTimeballCollision(basket, tb) {
        tb.disableBody(true, true);
        if (this.gameIsOver) return;

        this.timedEvent.delay += 5000;
        for (let i = 0; i < this.subjectSpawnRemaining.length; i++) {
            this.subjectSpawnRemaining[i]++;
        }
        this.sound.play('pop', { volume: 0.5 });
    }

    handleWifiballCollision(basket, wb) {
        wb.disableBody(true, true);
        if (this.gameIsOver) return;

        this.showError();
        this.sound.play('pop', { volume: 0.5 });
    }

    showError() {
        const errorImage = this.add.image(this.scale.width / 2, this.scale.height / 2, 'error')
            .setOrigin(0.5).setScale(0.5);

        this.basket.setVelocityX(0);
        this.input.keyboard.enabled = false;
        this.input.keyboard.resetKeys();
        this.basket.body.enable = false;

        this.time.delayedCall(5000, () => {
            if (errorImage) errorImage.destroy();
            if (!this.gameIsOver) {
                this.input.keyboard.enabled = true;
                this.input.keyboard.resetKeys();
                this.basket.body.enable = true;
            }
        });
    }

    finishGame(isWin) {
        if (this.gameIsOver) return;

        this.input.keyboard.enabled = true;
        if (this.basket && this.basket.body) this.basket.body.enable = true;

        this.gameIsOver = true;
        if (this.timedEvent) this.timedEvent.remove(false);

        this.cameras.main.fadeOut(500);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('GameOverScene', {
                isWin: isWin,
                score: this.getScoreForResult(isWin),
            });
        });
    }

    getCompletedCredits() {
        let n = 0;
        for (let i = 0; i < this.subjectBallCount.length; i++) {
            n += Math.floor(this.subjectBallCount[i] / 2);
        }
        return n;
    }

    /**
     * Thắng: 80 + bonus. Thua: điểm theo tín chỉ + bonus (tối đa 79) để bảng xếp hạng phản ánh tiến độ, luôn dưới mức thắng tối thiểu.
     */
    getScoreForResult(isWin) {
        if (isWin) return this.score;
        const credits = this.getCompletedCredits();
        const raw = credits * 4 + this.bonusScore;
        return Math.min(79, Math.max(0, Math.floor(raw)));
    }

    handGameOver() {
        this.gameIsOver = true;

        const totalCreditMarked = this.getCompletedCredits();
        const totalCreditNeeded = this.creditCounts.reduce((sum, count) => sum + count, 0);
        const isWin = totalCreditMarked === totalCreditNeeded;

        this.input.keyboard.enabled = true;
        if (this.basket && this.basket.body) this.basket.body.enable = true;

        this.cameras.main.fadeOut(500);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('GameOverScene', {
                isWin: isWin,
                score: this.getScoreForResult(isWin),
            });
        });
    }
}