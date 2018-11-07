"use strict";

(function(doc) {

    const query = doc.querySelector.bind(doc);
    const createNode = doc.createElement.bind(doc);
    const createTextNode = doc.createTextNode.bind(doc);

    doc.addEventListener("DOMContentLoaded", () => {
        let data, code = query('code').textContent,
            tableNode = query('#table');

        try {
            data = JSON.parse(code);
        }
        catch(ex) {
            data = [];
        }

        if(tableNode) {
            new Table(data, {
                sortable: true,
                table: tableNode
            }).fill();
        } else {
            throw('Table node not available.');
        }
    });

    /**
     * Class Table
     * Populate table on json object.
     */
    class Table {
        /**
         * Constructor Class Table
         * @param json -- json object to be populated
         * @param options -- interactive options object on table thead.
         */
        constructor(json=[], options) {
            this.keys = this._uniqueKeys(json);
            this.head = this._header(this.keys);
            this.json = this._transform(json);

            this.sortable = options.sortable || false;
            this.table = options.table;
        }

        fill() {
            this._thead(this.head);
            this._tbody(this.json);
        }

        _thead(objects) {
            this.table.createTHead();

            const row = this.table.tHead.insertRow(0);
            const action = this.sortable && this._sortBy;

            objects.forEach(obj =>
                row.appendChild(this._cell(obj.transValue, 'th', { dir: obj.dir }, action)));
        }

        _tbody(objects) {
            const tBody = this.table.createTBody();

            objects.forEach((obj) => {
                const row = tBody.insertRow(0);

                for(let key in obj) row.appendChild(this._cell(obj[key]));
            });
        }

        _cell(text, type='td', attrs={}, action=false) {
            const node = createNode(type);

            node.appendChild(createTextNode(text));

            if(action) {
                node.addEventListener('click', action.bind(this));
            }

            for(let key in attrs) {
                node.setAttribute(key, attrs[key]);
            }

            return node;
        }

        _sortBy(event) {
            const key = event.target.textContent;
            const obj = this.head.filter(obj => obj.key === key).shift();
            const dir = Sort.directions[(Sort.directions.indexOf(obj.dir || 'asc') + 1) % 2];

            this.head.forEach(o => o.dir = false);

            obj.dir = dir;

            new Sort(this.json, key, obj.dir).exec();

            this._refresh();
        }

        _refresh() {
            this.table.removeChild(this.table.tHead);
            this.table.removeChild(this.table.tBodies[0]);

            this.fill();
        }

        _header(keys) {
            return keys.map((key) => {
                return { key: key, transValue: key, dir: '' };
            });
        }

        _transform(json) {
            return json.map((obj) => {
                let o = {};
                this.keys.forEach(key => o[key] = obj[key] || '');
                return o;
            });
        }

        _uniqueKeys(json) {
            return json.reduce((res, obj) => {
                return res.concat(
                    Object.keys(obj).filter(key => res.indexOf(key) === -1))}, []);
        }
    }


    /** Class Sort
     * Handles sorting on json object.
     */
    class Sort {
        /**
         * Constructor
         * @param arr -- associative array
         * @param key -- sort key on object
         * @param dir -- direction
         */
        constructor(arr=[], key='', dir='asc') {
            this.arr = arr;
            this.key = key;
            this.dir = dir;
        }

        exec() {
            if(this.key && this.dir && this.arr) {
                this['_by' + this._type(this.key)]();
            }
        }

        static get directions() {
            return ['asc', 'desc'];
        }

        _type(key) {
            let type = '';

            switch(key) {
                case 'price':
                    type = 'Number';
                    break;
                case 'fda_date_approved':
                    type = 'Date';
                    break;
                case 'phone':
                    type = 'Phone';
                    break;
                default:
                    type = 'String';
                    break;
            }

            return type;
        }

        _byNumber() {
            this.arr.sort((a, b) => {
                const a1 = +a[this.key];
                const b1 = +b[this.key];

                return this.dir == 'desc' ?
                    (a1 || 0.00) - (b1 || 0.00) :
                    (b1 || Infinity) - (a1 || Infinity);
            });
        }

        _byString() {
            this.arr.sort((a, b) => {
                const a1 = a[this.key].toLowerCase();
                const b1 = b[this.key].toLowerCase();

                return this.dir == 'desc' ?
                    (a1 || '').localeCompare(b1 || ''):
                    (b1 || 'z').localeCompare(a1 || 'z');
            });
        }

        _byDate() {
            this.arr.sort((a, b) => {
                const a1 = a[this.key].split('/').reverse().join('');
                const b1 = b[this.key].split('/').reverse().join('');

                return this.dir == 'desc' ?
                    (a1 || 0) - (b1 || 0) :
                    (b1 || Infinity) - (a1 || Infinity);
            });
        }

        _byPhone() {
            this.arr.sort((a, b) => {
                const a1 = a[this.key].replace(/[\(\)\-]/g, '');
                const b1 = b[this.key].replace(/[\(\)\-]/g, '');

                return this.dir == 'desc' ?
                    (a1 || 0) - (b1 || 0) :
                    (b1 || Infinity) - (a1 || Infinity);
            });
        }
    }
})(window.document);
