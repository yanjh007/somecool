// test sparse array
const doTest6 = ()=> {
    const  { BinarySearchTree } = require("../bstree");

    const mvalues = new BinarySearchTree((a,b)=>{ 
        return b.score == a.score ? 0 : b.score > a.score ? 1 : -1;   
    })

    // add values
    for (let i = 0; i< 100; i++) {
        mvalues.add({
            score: 1000 + i + (0 | Math.random()* 8000),
            title: "Title-"+(1001+i)
        })
    }

    mvalues.print();

}

setTimeout(doTest6,1000);