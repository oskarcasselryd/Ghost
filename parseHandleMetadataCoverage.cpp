#include <bits/stdc++.h>
using namespace std;

int main() {
  int branch[19];
  
  for (int i = 0; i <= 18; ++i) {
    branch[i] = false;
  }
  
  string s;
  while (getline(cin, s)) {
    if (s.length() > 35) {
      if (s[32] == '#' && s[33] == '0') {
        int num = atoi(&s[33]);
        branch[num] = true;
      }
    }
  }
  
  int numReached = 0;
  cout << "Coverage details : \n";
  for (int i = 1; i <= 18; ++i) {
    cout << "Branch " << i << " => " << (branch[i] ? "true" : "false") << "\n"; 
  }
  
  cout << "\nBranch(es) not reached : \n";
  for (int i = 1; i <= 18; ++i) {
    if (!branch[i]) {
      cout << "Branch " << i << "\n";
    } else {
      ++numReached;
    }
  }
  
  cout << "\nThe code is covered at " << (double)numReached / 18.0 * 100.0 << "%\n\n"; 
}
