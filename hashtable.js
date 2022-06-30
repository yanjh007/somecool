


const TABLE_SIZE = 16; //256;
class HashTable {
    // array values 
    _values = Array();

    // init heap with comparer
    constructor(kfunc=(v)=>{ return JSON.stringify(v) }) {
        // setup  compareer
        this._kfunction = kfunc;
    }

    _search(ary,id) {
        // ary empty
        if (!ary || ary.length==0) return null;

        for(let i=0;i<ary.length; i++) {
            if (id == ary[i].id ) return ary[i];
        }
        return null;
    }

    _hash(key) {
        let 
        i = 0,
        h = 0,
        l = key.length;
    
        if ( l > 0 ) while (i < l) h = (h << 5) - h + key.charCodeAt(i++) | 0;
        h &= 0x7FFFFFFF;
        return h % TABLE_SIZE;
    }

    add(item) {
        let key = this._kfunction(item);
        let idx = this._hash(key);

        if (!this._values[idx]) this._values[idx] = new LinkTable();

        this._values[idx].add(key,item);
    }

    find(item, bremove = false) {
        let key = this._kfunction(item);
        let idx = this._hash(key);

        // empty link list
        if (!this._values[idx]) return null;

        // link list operation
        if (bremove) {
            return this._values[idx].remove(key);
        } else {
            return this._values[idx].find(key); 
        }
    }

    remove(item) { // wraped find function 
        return this.find(item,true);
    }
}
