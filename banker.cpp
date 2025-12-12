#include <iostream>
using namespace std;

int main() {
    int n, m;
    cout << "Enter number of processes: ";
    cin >> n;
    cout << "Enter number of resource types: ";
    cin >> m;

    int total[10], available[10];
    int maxm[10][10], allocation[10][10], need[10][10];

    cout << "Enter total instances of each resource:\n";
    for (int j = 0; j < m; j++) {
        cout << "R" << j << ": ";
        cin >> total[j];
    }

    cout << "Enter Max matrix:\n";
    for (int i = 0; i < n; i++) {
        cout << "Process P" << i << ":\n";
        for (int j = 0; j < m; j++) {
            cin >> maxm[i][j];
        }
    }

    cout << "Enter Allocation matrix:\n";
    for (int i = 0; i < n; i++) {
        cout << "Process P" << i << ":\n";
        for (int j = 0; j < m; j++) {
            cin >> allocation[i][j];
        }
    }

    // compute available
    for (int j = 0; j < m; j++) {
        int sum = 0;
        for (int i = 0; i < n; i++) sum += allocation[i][j];
        available[j] = total[j] - sum;
    }

    // compute need
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            need[i][j] = maxm[i][j] - allocation[i][j];
        }
    }

    bool finish[10] = {false};
    int work[10];
    for (int j = 0; j < m; j++) work[j] = available[j];

    int safeSeq[10], k = 0;

    while (true) {
        bool found = false;
        for (int i = 0; i < n; i++) {
            if (!finish[i]) {
                bool canRun = true;
                for (int j = 0; j < m; j++) {
                    if (need[i][j] > work[j]) {
                        canRun = false;
                        break;
                    }
                }
                if (canRun) {
                    for (int j = 0; j < m; j++) {
                        work[j] += allocation[i][j];
                    }
                    finish[i] = true;
                    safeSeq[k++] = i;
                    found = true;
                }
            }
        }
        if (!found) break;
    }

    bool safe = true;
    for (int i = 0; i < n; i++) {
        if (!finish[i]) {
            safe = false;
            break;
        }
    }

    if (safe) {
        cout << "System is in SAFE state.\nSafe sequence: ";
        for (int i = 0; i < n; i++)
            cout << "P" << safeSeq[i] << (i == n - 1 ? "\n" : " -> ");
    } else {
        cout << "System is in UNSAFE state (no safe sequence).\n";
    }

    return 0;
}
