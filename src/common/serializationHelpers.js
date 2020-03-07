
VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
	 : Vex.Xform);
VX = Vex.Xform;

// ## smoSerialize
// Helper functions that perform serialized merges, general JSON
// types of routines.
// ---
class smoSerialize {

	// ### filteredMerge
	// Like vexMerge, but only for specific attributes.
	static filteredMerge(attrs, src, dest) {
		attrs.forEach(function (attr) {
			if (typeof(src[attr]) != 'undefined') {
				dest[attr] = src[attr];
			}
		});
	}

    // used to generate a tokenization scheme that I will use to make
    // saved files smaller
    static jsonTokens(json) {
        var map = {};
        var label = 'a';
        var n1 = 0;
        var n2=-1;
        var addMap = (key) => {
            if (!map[key]) {
                map[key] = label;
                n1 += 1;
                if (n1 > 25) {
                    n2 += 1;
                    n1 = 0;
                }
                label = String.fromCharCode(97+n1);
                if (n2 >= 0) {
                    label += String.fromCharCode(97+n2);
                }
            }
        }
        var _tokenRecurse = (obj) =>  {
            var keys = Object.keys(obj);
            keys.forEach((key) => {
                var val = obj[key];
                if (typeof(val) == 'string' || typeof(val) == 'number') {
                    addMap(key);
                }
                if (typeof(val) == 'object') {
                    if (Array.isArray(val)) {
                        addMap(key);
                        val.forEach((arobj) => {
                            if (arobj && typeof(arobj) == 'object') {
                                _tokenRecurse(arobj);
                            }
                        });
                    } else {
                        addMap(key);
                      _tokenRecurse(val);
                   }
                }

            });
        }
        _tokenRecurse(json);
        var mkar = Object.keys(map);
        var m2 = {};
        mkar.forEach((mk) => {
            m2[map[mk]] = mk;
        })
        console.log(JSON.stringify(m2,null,' '));
    }
	// ### serializedMerge
	// serialization-friendly, so merged, copied objects are deep-copied
	static serializedMerge(attrs, src, dest) {
		attrs.forEach(function (attr) {
			if (typeof(src[attr]) != 'undefined') {
				// copy the number 0
				if (typeof(src[attr]) === 'number' ||
					typeof(src[attr]) === 'boolean') {
					dest[attr] = src[attr];
					// copy the empty array
				} else if (Array.isArray(src[attr])) {
					dest[attr] = JSON.parse(JSON.stringify(src[attr]));
				} else {
					// but don't copy empty/null objects
					if (src[attr]) {
						if (typeof(src[attr]) == 'object') {
							dest[attr] = JSON.parse(JSON.stringify(src[attr]));
						} else {
							dest[attr] = src[attr];
						}
					}
				}
			}
		});
	}
    static serializedMergeNonDefault(defaults,attrs,src,dest) {
        attrs.forEach(function (attr) {
			if (typeof(src[attr]) != 'undefined') {
				// copy the number 0
				if (typeof(src[attr]) === 'number' ||
					typeof(src[attr]) === 'boolean') {
                        if (src[attr] != defaults[attr]) {
					        dest[attr] = src[attr];
                        }
					// copy the empty array
				} else if (Array.isArray(src[attr])) {
                    var defval = JSON.stringify(defaults[attr]);
                    var srcval = JSON.stringify(src[attr]);
                    if (defval != srcval) {
					    dest[attr] = JSON.parse(srcval);
                    }
				} else {
					// but don't copy empty/null objects
					if (src[attr]) {
						if (typeof(src[attr]) == 'object') {
                            var defval = JSON.stringify(defaults[attr]);
                            var srcval = JSON.stringify(src[attr]);
                            if (defval != srcval) {
                                dest[attr] = JSON.parse(srcval);
                            }
						} else {
                            if (src[attr] != defaults[attr]) {
							    dest[attr] = src[attr];
                            }
						}
					}
				}
			}
		});
    }

	static stringifyAttrs(attrs, obj) {
		var rv = '';
		attrs.forEach((attr) => {
			if (obj[attr]) {
				rv += attr + ':' + obj[attr] + ', ';
			} else {
				rv += attr + ': null,';
			}
		});
		return rv;
	}
}
