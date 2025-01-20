const functions = ['sin', 'cos', 'tan', 'cot'];
const angles = [0, 30, 45, 60, 90];
const answers = {
    'sin': ['0', '1/2', '√2/2', '√3/2', '1'],
    'cos': ['1', '√3/2', '√2/2', '1/2', '0'],
    'tan': ['0', '1/√3', '1', '√3', 'Infinity'],
    'cot': ['Infinity', '√3', '1', '1/√3', '0']
};

let stats = JSON.parse(localStorage.getItem('trigStats')) || initializeStats();
let currentFunction, currentAngle, correctAnswer;
let score = 0;
let totalQuestions = 0;
let startTime;
let timerInterval;
let isAnswered = false;

function initializeStats() {
    const initialStats = {};
    functions.forEach(func => {
        initialStats[func] = angles.reduce((acc, angle) => {
            acc[angle] = { correct: 0, total: 0, time: 0 };
            return acc;
        }, {});
    });
    localStorage.setItem('trigStats', JSON.stringify(initialStats));
    return initialStats;
}

function saveStats() {
    localStorage.setItem('trigStats', JSON.stringify(stats));
}

function getRandomWeightedFunction() {
    const weights = functions.map(func => {
        const totalIncorrect = Object.values(stats[func]).reduce((sum, { correct, total }) => sum + (total - correct), 0);
        return totalIncorrect + 1;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < weights.length; i++) {
        if (random < weights[i]) return functions[i];
        random -= weights[i];
    }
}

function getRandomWeightedAngle(func) {
    const weights = angles.map(angle => {
        const { correct, total } = stats[func][angle];
        return (total - correct) + 1;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < weights.length; i++) {
        if (random < weights[i]) return angles[i];
        random -= weights[i];
    }
}

function updateTimer() {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    document.getElementById('timer').innerText = `Time: ${elapsedTime}s`;
}

function generateQuestion() {
    currentFunction = getRandomWeightedFunction();
    currentAngle = getRandomWeightedAngle(currentFunction);
    correctAnswer = answers[currentFunction][angles.indexOf(currentAngle)];
    const questionBlock = document.getElementById('question');
    questionBlock.innerText = `What is ${currentFunction}(${currentAngle}°)?`;
    questionBlock.className = 'question alert alert-primary'; // Reset question styles
    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 100);
    isAnswered = false;
    renderOptions();
}

function renderOptions() {
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    const options = [...answers[currentFunction]];
    options.sort(() => Math.random() - 0.5);

    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'btn btn-primary';
        button.innerText = option;
        button.onclick = () => checkAnswer(option);
        optionsContainer.appendChild(button);
    });
}

function checkAnswer(selectedAnswer) {
    if (isAnswered) return;

    clearInterval(timerInterval);
    isAnswered = true;
    const timeTaken = (Date.now() - startTime) / 1000;
    totalQuestions++;
    const stat = stats[currentFunction][currentAngle];
    stat.total++;
    stat.time = ((stat.time * (stat.total - 1)) + timeTaken) / stat.total;

    const questionBlock = document.getElementById('question');
    if (selectedAnswer === correctAnswer) {
        score++;
        stat.correct++;
        questionBlock.className = 'question alert alert-success';
        questionBlock.innerText = 'Success!';
    } else {
        questionBlock.className = 'question alert alert-danger';
        questionBlock.innerText = `Wrong! The correct answer was ${correctAnswer}.`;
    }

    document.getElementById('score').innerText = `Score: ${score} / ${totalQuestions}`;
    saveStats();
    setTimeout(generateQuestion, 2000);
}

function showStats() {
    const statsDiv = document.getElementById('stats');
    statsDiv.innerHTML = '';

    for (const func of functions) {
        statsDiv.innerHTML += `<h5>${func}</h5>`;
        for (const angle of angles) {
            const { correct, total, time } = stats[func][angle];
            statsDiv.innerHTML += `<p>${func}(${angle}°): ${correct} / ${total}, Avg Time: ${(time || 0).toFixed(2)}s</p>`;
        }
    }

    new bootstrap.Modal(document.getElementById('statsModal')).show();
}

function resetStats() {
    stats = initializeStats();
    saveStats();
    showStats();
}

generateQuestion();
