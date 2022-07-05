// test sparse array
const doTest6 = ()=> {
    const  { addJob, startWheel } = require("../timewheel2");

    startWheel(r=>{
        console.log("Job:",r);
    })

    let istart = 0 | Date.now()/1000;
    // add values
    for (let i = 0; i< 1000; i++) {
        addJob({
            id: "id_" + (1000+i),
            // time: istart + 20 + i * 10
            time: istart + 10 + 0 | (Date.now()/1000 + Math.random() * 4000)
        });
    }

    addJob({
        id: "id_l" ,
        time: istart + 30
        // time: 0 | (Date.now()/1000 + Math.random() * 1000) + 10
    });

}

setTimeout(doTest6,1000);