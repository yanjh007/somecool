
class RedBlackTree {
    constructor(comper = (a,b) => {return b > a }) {
        this._comper = comper;
    }

    // add node in tree
    add(cnode){


    }


    _leftOf() {

    }

    // fix after insert 
    _fix(cnode){
        // new node must red
        cnode.isRed  = true;

        // father and uncle status
        let father,grandfather,uncle;

        
        // until root 
        while(!cnode.isRoot) {
            father = cnode.father; // father
            if (father)
            grandfather = fahter.father; // father
    
            father.isLeft = false;
            
            uncle  = cnode.uncle; // father
            uncle.isLeft = !father.isLeft;
            
            // father is grandfather's left child
            if(father.isLeft) {
                if (uncle.isRed) {

                }

            } else {

            }


        }

        this._root.isRed = false;
    }


}


