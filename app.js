// ImageNet 클래스명에 등장하는 개/고양이 관련 키워드.
// MobileNet은 개 품종 약 120개, 고양이 5개를 별도 클래스로 분류한다.
const DOG_KEYWORDS = [
  'dog', 'terrier', 'retriever', 'spaniel', 'hound', 'setter', 'poodle',
  'schnauzer', 'shepherd', 'mastiff', 'corgi', 'husky', 'collie', 'pinscher',
  'pointer', 'griffon', 'springer', 'ridgeback', 'bouvier', 'boston bull',
  'chihuahua', 'pekinese', 'shih-tzu', 'papillon', 'beagle', 'borzoi',
  'whippet', 'saluki', 'weimaraner', 'airedale', 'cairn', 'lhasa', 'vizsla',
  'clumber', 'kuvasz', 'schipperke', 'groenendael', 'malinois', 'briard',
  'kelpie', 'komondor', 'rottweiler', 'doberman', 'boxer', 'dalmatian',
  'basenji', 'pug', 'leonberg', 'newfoundland', 'samoyed', 'pomeranian',
  'chow', 'keeshond', 'malamute', 'basset', 'bluetick', 'redbone',
  'appenzeller', 'entlebucher', 'great dane', 'saint bernard',
  'great pyrenees', 'dandie dinmont', 'mexican hairless',
];

// 'cat' 단독으로 매칭하면 'Madagascar cat'(여우원숭이) 같은 클래스가 걸려서 구체적으로 지정한다.
const CAT_KEYWORDS = [
  'tabby', 'tiger cat', 'persian cat', 'siamese cat', 'egyptian cat',
];

const THRESHOLD = 0.3;

const VERDICTS = {
  dog: { icon: '#i-dog', text: '개입니다' },
  cat: { icon: '#i-cat', text: '고양이입니다' },
  unknown: { icon: '#i-unknown', text: '개나 고양이로 보이지 않습니다' },
};

const statusEl = document.getElementById('status');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const resultEl = document.getElementById('result');
const preview = document.getElementById('preview');
const verdictIcon = document.getElementById('verdictIcon');
const verdictText = document.getElementById('verdictText');
const percentEl = document.getElementById('percent');
const meterFill = document.getElementById('meterFill');

let model = null;

function scoreVerdict(predictions) {
  let dog = 0;
  let cat = 0;

  for (const { className, probability } of predictions) {
    const name = className.toLowerCase();
    if (CAT_KEYWORDS.some((k) => name.includes(k))) {
      cat += probability;
    } else if (DOG_KEYWORDS.some((k) => name.includes(k))) {
      dog += probability;
    }
  }

  const confidence = Math.max(dog, cat);
  if (confidence < THRESHOLD) {
    return { type: 'unknown', confidence };
  }
  return { type: dog >= cat ? 'dog' : 'cat', confidence };
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
}

function showVerdict(type, confidence) {
  const { icon, text } = VERDICTS[type];
  const percent = Math.round(confidence * 100);

  resultEl.className = `result is-${type}`;
  verdictIcon.setAttribute('href', icon);
  verdictText.textContent = text;
  percentEl.textContent = `${percent}%`;
  meterFill.style.width = `${percent}%`;
}

async function classify() {
  setStatus('판별 중...');
  try {
    const predictions = await model.classify(preview, 5);
    const { type, confidence } = scoreVerdict(predictions);
    showVerdict(type, confidence);
    setStatus('다른 사진도 올려보세요.');
  } catch (err) {
    console.error(err);
    resultEl.hidden = true;
    setStatus('판별에 실패했습니다. 다시 시도해주세요.', true);
  }
}

function handleFile(file) {
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    resultEl.hidden = true;
    setStatus('이미지 파일만 업로드 가능합니다.', true);
    return;
  }

  if (!model) {
    setStatus('모델을 아직 불러오는 중입니다. 잠시 후 다시 시도해주세요.', true);
    return;
  }

  resultEl.className = 'result is-pending';
  resultEl.hidden = false;
  verdictText.textContent = '판별 중...';
  meterFill.style.width = '0';

  preview.src = URL.createObjectURL(file);
  preview.onload = classify;
}

dropzone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  handleFile(e.dataTransfer.files[0]);
});

mobilenet.load()
  .then((loaded) => {
    model = loaded;
    setStatus('준비 완료! 사진을 올려보세요.');
  })
  .catch((err) => {
    console.error(err);
    setStatus('모델을 불러오지 못했습니다. 새로고침 해주세요.', true);
  });
