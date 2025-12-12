let n = 0;
let m = 0;

let total = [];
let available = [];
let maxMatrix = [];
let allocationMatrix = [];
let needMatrix = [];
let pendingRequests = [];

function addLog(message) {
    const logArea = document.getElementById("logArea");
    const div = document.createElement("div");
    div.textContent = message;
    logArea.prepend(div);
}

function createVectorInputs(length, containerId, prefix) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    for (let j = 0; j < length; j++) {
        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.value = "0";
        input.id = prefix + "_" + j;
        container.appendChild(input);
    }
}

function createMatrixInputs(rows, cols, containerId, prefix) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const input = document.createElement("input");
            input.type = "number";
            input.min = "0";
            input.value = "0";
            input.id = prefix + "_" + i + "_" + j;
            container.appendChild(input);
        }
        container.appendChild(document.createElement("br"));
    }
}

document.getElementById("btnInitSystem").onclick = function () {
    n = parseInt(document.getElementById("numProcesses").value, 10);
    m = parseInt(document.getElementById("numResources").value, 10);

    if (!n || !m || n <= 0 || m <= 0) {
        alert("Enter valid n and m");
        return;
    }

    document.getElementById("totalBox").style.display = "block";
    document.getElementById("matricesBox").style.display = "block";
    document.getElementById("requestBox").style.display = "block";
    document.getElementById("deadlockBox").style.display = "block";

    createVectorInputs(m, "totalResourcesInputs", "total");
    createMatrixInputs(n, m, "maxMatrixInputs", "max");
    createMatrixInputs(n, m, "allocationMatrixInputs", "alloc");
    createVectorInputs(m, "requestVectorInputs", "req");

    const sel = document.getElementById("requestProcess");
    sel.innerHTML = "";
    for (let i = 0; i < n; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "P" + i;
        sel.appendChild(opt);
    }

    total = new Array(m).fill(0);
    available = new Array(m).fill(0);
    maxMatrix = [];
    allocationMatrix = [];
    needMatrix = [];
    pendingRequests = [];

    for (let i = 0; i < n; i++) {
        maxMatrix.push(new Array(m).fill(0));
        allocationMatrix.push(new Array(m).fill(0));
        needMatrix.push(new Array(m).fill(0));
        pendingRequests.push(new Array(m).fill(0));
    }

    addLog("System initialized with " + n + " processes and " + m + " resources.");
};

document.getElementById("btnUpdateSystem").onclick = function () {
    for (let j = 0; j < m; j++) {
        total[j] = parseInt(document.getElementById("total_" + j).value, 10) || 0;
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            const maxVal = parseInt(document.getElementById("max_" + i + "_" + j).value, 10) || 0;
            const allocVal = parseInt(document.getElementById("alloc_" + i + "_" + j).value, 10) || 0;
            if (allocVal > maxVal) {
                alert("Allocation > Max at P" + i + ", R" + j);
                return;
            }
            maxMatrix[i][j] = maxVal;
            allocationMatrix[i][j] = allocVal;
        }
    }

    for (let j = 0; j < m; j++) {
        let sumAlloc = 0;
        for (let i = 0; i < n; i++) sumAlloc += allocationMatrix[i][j];
        available[j] = total[j] - sumAlloc;
        if (available[j] < 0) {
            alert("Total of resource R" + j + " exceeded");
            return;
        }
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            needMatrix[i][j] = maxMatrix[i][j] - allocationMatrix[i][j];
        }
    }

    updateNeedView();
    updateAvailableView();

    const res = bankersSafetyCheck();
    if (res.safe) {
        document.getElementById("safeSequenceView").textContent =
            "Safe sequence: " + res.sequence.map(x => "P" + x).join(" -> ");
        addLog("System is in SAFE state.");
    } else {
        document.getElementById("safeSequenceView").textContent = "System is UNSAFE (no safe sequence).";
        addLog("System is in UNSAFE state.");
    }

    drawRAG([]);
};

function bankersSafetyCheck() {
    const work = available.slice();
    const finish = new Array(n).fill(false);
    const sequence = [];

    while (true) {
        let found = false;
        for (let i = 0; i < n; i++) {
            if (!finish[i]) {
                let canRun = true;
                for (let j = 0; j < m; j++) {
                    if (needMatrix[i][j] > work[j]) {
                        canRun = false;
                        break;
                    }
                }
                if (canRun) {
                    for (let j = 0; j < m; j++) work[j] += allocationMatrix[i][j];
                    finish[i] = true;
                    sequence.push(i);
                    found = true;
                }
            }
        }
        if (!found) break;
    }

    const safe = finish.every(x => x);
    return { safe, sequence };
}

document.getElementById("btnRequest").onclick = function () {
    const p = parseInt(document.getElementById("requestProcess").value, 10);
    const request = [];
    for (let j = 0; j < m; j++) {
        request[j] = parseInt(document.getElementById("req_" + j).value, 10) || 0;
    }

    for (let j = 0; j < m; j++) {
        if (request[j] > needMatrix[p][j]) {
            alert("Request > Need for P" + p);
            return;
        }
    }

    for (let j = 0; j < m; j++) {
        if (request[j] > available[j]) {
            addLog("P" + p + " request cannot be granted now (not enough available).");
            pendingRequests[p] = request.slice();
            drawRAG([]);
            return;
        }
    }

    for (let j = 0; j < m; j++) {
        available[j] -= request[j];
        allocationMatrix[p][j] += request[j];
        needMatrix[p][j] -= request[j];
    }

    const res = bankersSafetyCheck();
    if (res.safe) {
        addLog("Request of P" + p + " GRANTED. System remains safe.");
        pendingRequests[p] = new Array(m).fill(0);
        updateNeedView();
        updateAvailableView();
        document.getElementById("safeSequenceView").textContent =
            "Safe sequence: " + res.sequence.map(x => "P" + x).join(" -> ");
    } else {
        for (let j = 0; j < m; j++) {
            available[j] += request[j];
            allocationMatrix[p][j] -= request[j];
            needMatrix[p][j] += request[j];
        }
        addLog("Request of P" + p + " DENIED. It would make system unsafe.");
        pendingRequests[p] = request.slice();
    }

    drawRAG([]);
};

function detectDeadlock() {
    const work = available.slice();
    const finish = new Array(n).fill(false);

    for (let i = 0; i < n; i++) {
        let hasAlloc = false;
        for (let j = 0; j < m; j++) {
            if (allocationMatrix[i][j] > 0) {
                hasAlloc = true;
                break;
            }
        }
        if (!hasAlloc) finish[i] = true;
    }

    while (true) {
        let found = false;
        for (let i = 0; i < n; i++) {
            if (!finish[i]) {
                let canRun = true;
                for (let j = 0; j < m; j++) {
                    if (needMatrix[i][j] > work[j]) {
                        canRun = false;
                        break;
                    }
                }
                if (canRun) {
                    for (let j = 0; j < m; j++) work[j] += allocationMatrix[i][j];
                    finish[i] = true;
                    found = true;
                }
            }
        }
        if (!found) break;
    }

    const deadlocked = [];
    for (let i = 0; i < n; i++) {
        if (!finish[i]) deadlocked.push(i);
    }
    return deadlocked;
}

document.getElementById("btnDetectDeadlock").onclick = function () {
    const dead = detectDeadlock();
    if (dead.length === 0) {
        addLog("No deadlock detected.");
    } else {
        addLog("Deadlock detected among: " + dead.map(x => "P" + x).join(", "));
    }
    drawRAG(dead);
};

document.getElementById("btnRecover").onclick = function () {
    const dead = detectDeadlock();
    if (dead.length === 0) {
        addLog("No deadlock to recover from.");
        return;
    }

    let victim = dead[0];
    let maxAlloc = allocationMatrix[victim].reduce((a, b) => a + b, 0);

    for (const p of dead) {
        const sum = allocationMatrix[p].reduce((a, b) => a + b, 0);
        if (sum > maxAlloc) {
            maxAlloc = sum;
            victim = p;
        }
    }

    for (let j = 0; j < m; j++) {
        available[j] += allocationMatrix[victim][j];
        allocationMatrix[victim][j] = 0;
        needMatrix[victim][j] = 0;
        pendingRequests[victim][j] = 0;
    }

    addLog("Recovered by terminating P" + victim + " and releasing its resources.");
    updateNeedView();
    updateAvailableView();
    drawRAG([]);
};

function updateNeedView() {
    const container = document.getElementById("needMatrixView");
    container.innerHTML = "";
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            const input = document.createElement("input");
            input.type = "number";
            input.value = needMatrix[i][j];
            input.disabled = true;
            container.appendChild(input);
        }
        container.appendChild(document.createElement("br"));
    }
}

function updateAvailableView() {
    const container = document.getElementById("availableView");
    container.innerHTML = "";
    for (let j = 0; j < m; j++) {
        const input = document.createElement("input");
        input.type = "number";
        input.value = available[j];
        input.disabled = true;
        container.appendChild(input);
    }
}

function drawRAG(deadlockedProcesses) {
    const canvas = document.getElementById("ragCanvas");
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (n === 0 || m === 0) {
        ctx.fillStyle = "#555";
        ctx.fillText("Initialize system to see graph", 10, 20);
        return;
    }

    const processY = height * 0.25;
    const resourceY = height * 0.75;

    const processPos = [];
    const resourcePos = [];

    for (let i = 0; i < n; i++) {
        const x = (i + 1) * (width / (n + 1));
        processPos.push({ x, y: processY });

        const isDead = deadlockedProcesses.includes(i);

        ctx.beginPath();
        ctx.arc(x, processY, 15, 0, 2 * Math.PI);
        ctx.fillStyle = isDead ? "#f87171" : "#60a5fa";
        ctx.fill();
        ctx.strokeStyle = "#333";
        ctx.stroke();
        ctx.fillStyle = "#000";
        ctx.fillText("P" + i, x - 8, processY + 4);
    }

    for (let j = 0; j < m; j++) {
        const x = (j + 1) * (width / (m + 1));
        resourcePos.push({ x, y: resourceY });

        const size = 22;
        ctx.beginPath();
        ctx.rect(x - size / 2, resourceY - size / 2, size, size);
        ctx.fillStyle = "#facc15";
        ctx.fill();
        ctx.strokeStyle = "#333";
        ctx.stroke();
        ctx.fillStyle = "#000";
        ctx.fillText("R" + j, x - 8, resourceY + 4);
    }

    ctx.lineWidth = 1.2;

    ctx.strokeStyle = "#22c55e";
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            if (allocationMatrix[i][j] > 0) {
                const p = processPos[i];
                const r = resourcePos[j];
                drawArrow(ctx, r.x, r.y - 15, p.x, p.y + 15);
            }
        }
    }

    ctx.strokeStyle = "#f97316";
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            if (pendingRequests[i][j] > 0) {
                const p = processPos[i];
                const r = resourcePos[j];
                drawArrow(ctx, p.x, p.y + 15, r.x, r.y - 15);
            }
        }
    }
}

function drawArrow(ctx, fromx, fromy, tox, toy) {
    const headlen = 8;
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(
        tox - headlen * Math.cos(angle - Math.PI / 6),
        toy - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        tox - headlen * Math.cos(angle + Math.PI / 6),
        toy - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
}
