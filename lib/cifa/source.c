
void Solution() {
    int wrongNum = 123abc;
    char wrongChar = '1a';
    int num;
    int maxDepth(TreeNode* root) {
        if (!root) return 0;

        num = 0;
        travel(root, 1);
        return num;
    }
    void travel(TreeNode* root, int level) {
        if (!root->left && !root->right) {
            num = max(num, level);
            return;
        }
        if (root->left) {
            travel(root->left, level + 1);
        }
        if (root->right) {
            travel(root->right, level + 1);
        }
    }
};

int main() {
    return 0;
}
