const 
ILEFT    = -1,
IRIGHT   = 1,
ICURRENT = 0;

class BinarySearchTree {
    // init with comparer
    constructor(cmper) {
        // setup  compareer
        this._comparer = cmper ? cmper : (a,b) => { 
            return a == b ? 0 : a < b ? -1 : 1; 
        };
    }

    // add element to node default root
    add(element, node = this._root) {
        if (!node) { // add root 
            this._root = { value: element };
            return element;
        } 
        
        switch(this._comparer(element,node)) {
            case -1: 
                if (node.left) {
                    this.add(element,node.left);
                } else {
                    node.left = { value: element };
                }
            break;
            case 1:
                if (node.right) {
                    this.add(element,node.right);
                } else {
                    node.right = { value: element };
                }
            break;
            case 0: return null; // donothing if equal
        }

        // banlance tree;
        this.balance();
        return element;
    }

    // search element value recursion 
    find(element, node = this._root ) {
        if (!node) return null;
        
        switch(this._comparer(element,node.value)) {
            case -1: return this.find(element,node.left);
            case 1 : return this.find(element,node.right);
            case 0 : return node.value ; // finded
        }
    }

    // find mini subnode of node 
    findMin(node = this._root, bremove = false ) {
        if (!node) return null;
        
        if (bremove) {
            // find parent
            let pnode = node;
            while (node = node.left) {
                pnode = node;
            }

            if (pnode) {
                node = pnode.left;
                // remove from pnode 
                pnode.left = null;
                return node.value;
            } else {
                return null;
            }
        } else { // find left of left
            return node.left ? this.findMin(node.left) : node;
        }
    }

    // find mini subnode of node 
    findMax(node = this._root ) {
        if (!node) return null;
        
        // find left of left
        return node.right ? this.findMax(node.right) : node;
    }

    // remove element by compare
    remove(element, pnode=null, node = this._root, isLeft=true) {
        if (!node) return null;

        switch(this._comparer(node.value,element)) {
            case -1: return this.remove(element, node, node.left);
            case  1: return this.remove(element, node, node.right, false);
        }

        // find and remove
        if (pnode) { // not root 
            if (!node.left && !node.right) { // node is leaf

            } else 
            
            if (node.left && node.right) { // has both leaf
                // find minnode of right tree
                let minNode = this.findMin(node.right);

                // set minode left use node left
                minNode.left  = node.left;

                // replace parent node's child
                if(isLeft) {
                    pnode.left  = minNode;
                } else {
                    pnode.right = minNode;
                }

            } else  { // single leaf left 
                if (isLeft) {
                    pnode.left  = node.left  ? node.left : null; 
                } else {
                    pnode.right = node.right ? node.right : null;
                }
            }
        } else { // root element 
            if (this._root.right) { // has right node 
                this._root.right.left = this._root.left;
                this._root = this._root.right;
            } else { // just left 
                this._root = this._root.left;
            }
        }

        return this.remove(element, null, this._root);
    }

    // travler 
    travel(node = this._root, tmode=2) {
        let ary = [], ary1;
        if (node == null) return ;
        switch(tmode) {
            case 1:
                
            break;
            case 2: // middle travle
                if (node.left) { // travel left 
                    ary1 = this.travel(node.left);
                    ary = [...ary,...ary1];
                }
                
                ary.push(node.value);
    
                if (node.right) { // travel right
                    ary1 = this.travel(node.right);
                    ary = [...ary,...ary1];
                }
            break;
        }
        return ary;
    }

    print(){
        let rarray = this.travel();
        console.log(rarray);
    }

    // remove min or max item
    getRoot() {  return this._root.value;  }
    pop() { return this.findMax(this._root, true) };
    unshift() { return this.findMin(this._root, true) };

    // node height 0n 1l 2r
    nheight(node,t=0) { // current nodes height
        if (!node) return 0;
        return Math.max(node.left ? this.nheight(node.left) : 0, node.right ? this.nheight(node.right) : 0) + 1;
    }

    // node left rotate
    leftRotate(node = this._root) {
        // right node as root 
        let ritem = node.right;

        // right is node right's left remain left 
        node.right = node.right.left;

        // root's left is current node 
        ritem.left = node;
        this._root = ritem;
    }

    // node left rotate
    rightRotate(node = this._root) {
        // right node as root 
        let ritem = node.left;

        // right is node right's left 
        node.left = node.left.right;

        // root's right is current node 
        ritem.right = node; 
        this._root = ritem;
    }

    // balance double rotate
    balance(node= this._root) {
        if (!node) return;
    
        // left higher than right
        let h = this.nheight(node.left) - this.nheight(node.right);

        if (h > 1 ) {
            // left rotate left node if needed
            if (this.nheight(node.left.left) > this.nheight(node.left.right)) {
                this.leftRotate(node.left);
            }

            // do right rotate 
            this.rightRotate();
        } else if (h < -1) {
            // right rotate right node if needed
            if (this.nheight(node.right.left) > this.nheight(node.right.right)) {
                this.rightRotate(node.right);
            }

            // always left rotate
            this.leftRotate();
        }
    }



}

module.exports = { BinarySearchTree };