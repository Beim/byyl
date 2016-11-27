int a,b = 1;
float c,d;
int[2][3] arr;
int func(int a, int b) {
    int inner() {
        return 2 * a;
    }
    int c = a + b;
    c = a + b;
    if (c > 0 && c <= 10) {
        return inner();
    } else {
        return inner();
    }
}
int func1() {
    int a,b = 1;
    while (a < 5) {
        if (b > 0) {
            a++;
        } else {
            a--;
        }
    }
    return a;
}

c = a + 2.2;
d = a + 2.2;
b = a + 1;

arr[1][1] = func(a, b);
arr[1][2] = func1();
