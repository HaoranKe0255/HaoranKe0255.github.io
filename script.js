const serverUrl = 'http://localhost:3000'; // server URL

let initialAccuracy = [0, 0, 0]; // Accuracy（History, Social Science, Computer Security）
let initialResponseTime = [0, 0, 0]; // Response time（History, Social Science, Computer Security）

let accuracyChartInstance; 
let responseTimeChartInstance; 

// default chart
updateVisualizations(initialAccuracy, initialResponseTime);

// get random quesitons and show
document.getElementById('getQuestion').addEventListener('click', async () => {
    const domain = document.getElementById('domain').value;
    try {
        const response = await fetch(`${serverUrl}/questions/random?domain=${domain}`);
        const question = await response.json();

        if (question.error) {
            document.getElementById('questionDisplay').innerText = `Error: ${question.error}`;
        } else {
            document.getElementById('questionDisplay').innerText = `Question: ${question.question}`;
            document.getElementById('sendToChatGPT').style.display = 'inline-block';
            window.currentQuestion = { ...question, domain };
        }
    } catch (error) {
        console.error('Error fetching question:', error);
        document.getElementById('questionDisplay').innerText = 'Error fetching question. Please try again.';
    }
});

// sned to ChatGPT
document.getElementById('sendToChatGPT').addEventListener('click', async () => {
    const { question, domain } = window.currentQuestion || {};
    if (!question || !domain) {
        alert('No question available. Please fetch a question first.');
        return;
    }

    try {
        const startTime = performance.now();

        const response = await fetch(`${serverUrl}/chatgpt/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, domain }),
        });
        const data = await response.json();

        const endTime = performance.now();
        const responseTime = ((endTime - startTime) / 1000).toFixed(2);

        if (data.error) {
            document.getElementById('chatgptResponse').innerText = `Error: ${data.error}`;
        } else {
            document.getElementById('chatgptResponse').innerText = 
                `ChatGPT Response: ${data.chatgptResponse}\nResponse Time: ${responseTime} seconds`;

            const accuracy = getAccuracy(
                data.chatgptResponse || '',
                data.updatedQuestion?.expected_answer || ''
            );
            updateVisualizations([accuracy, accuracy, accuracy], [responseTime, responseTime, responseTime]);
        }
    } catch (error) {
        console.error('Error fetching ChatGPT response:', error);
        document.getElementById('chatgptResponse').innerText = 'Error fetching ChatGPT response. Please try again.';
    }
});

// get accuracy
function getAccuracy(chatgptResponse, correctAnswer) {
    if (!chatgptResponse || !correctAnswer) {
        console.warn('Missing response or expected answer:', chatgptResponse, correctAnswer);
        return 0;
    }
    return chatgptResponse.toLowerCase().includes(correctAnswer.toLowerCase()) ? 100 : 0;
}

// update visualization
function updateVisualizations(accuracyRates, responseTimes) {
    const accuracyCtx = document.getElementById('accuracyChart').getContext('2d');
    const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');

    if (accuracyChartInstance) {
        accuracyChartInstance.destroy();
    }
    if (responseTimeChartInstance) {
        responseTimeChartInstance.destroy();
    }

    accuracyChartInstance = new Chart(accuracyCtx, {
        type: 'line',
        data: {
            labels: ['History', 'Social Science', 'Computer Security'],
            datasets: [{
                label: 'Accuracy (%)',
                data: accuracyRates,
                borderColor: 'rgba(54, 162, 235, 0.6)',
                fill: false,
                borderWidth: 2,
                tension: 0.1
            }],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 20
                    }
                }
            }
        }
    });

    responseTimeChartInstance = new Chart(responseTimeCtx, {
        type: 'line',
        data: {
            labels: ['History', 'Social Science', 'Computer Security'],
            datasets: [{
                label: 'Response Time (s)',
                data: responseTimes,
                borderColor: 'rgba(255, 99, 132, 0.6)',
                fill: false,
                borderWidth: 2,
                tension: 0.1
            }],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 0.5
                    }
                }
            }
        }
    });
}
