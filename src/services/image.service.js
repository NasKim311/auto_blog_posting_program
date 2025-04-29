const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ImageService {
    // 이미지 다운로드 함수
    async downloadImages(imageURLs) {
        console.log('이미지 다운로드 시작...');
        const downloadedPaths = [];

        // 이미지 저장 디렉토리 생성
        const imgDir = path.join(__dirname, 'temp_images');
        if (!fs.existsSync(imgDir)) {
            fs.mkdirSync(imgDir);
        }

        // 각 이미지 다운로드
        for (let i = 0; i < imageURLs.length; i++) {
            try {
                const imageURL = imageURLs[i];
                const imagePath = path.join(imgDir, `image_${Date.now()}_${i}.jpg`);

                const response = await axios({
                    method: 'GET',
                    url: imageURL,
                    responseType: 'stream',
                });

                const writer = fs.createWriteStream(imagePath);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                downloadedPaths.push(imagePath);
            } catch (error) {
                console.error(`이미지 다운로드 실패: ${imageURLs[i]}`, error.message);
            }
        }

        console.log(`${downloadedPaths.length}개의 이미지 다운로드 완료`);
        return downloadedPaths;
    }
}

module.exports = new ImageService();
