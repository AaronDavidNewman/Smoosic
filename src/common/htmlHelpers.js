
var smoDomBuilder = function (el) {}

class htmlHelpers {
    /**
     *  Helper functions for buildling DOM trees in javascript.
     * @param {} el
     * @returns {}
     */

    /**
     *DOM builder for javascript.  Syntactic sugar around jquery builder.
     * Usage:
     * var b = htmlHelpers.buildDom();

     *  var r =
    b('tr').classes('jsSharingMember').data('entitykey', key).data('name', name).data('entitytype', entityType).append(
    b('td').classes('noSideBorderRight').append(
    ...
    $(parent).append(r.dom());

    Don't forget the '.dom()' !  That is the actual jquery element objet
     * @param {} el
     * @returns {}
     */
    static buildDom = function (el) {
        var smoDomBuilder = function (el) {
            this.e = $('<' + el + '/>');
            var self = this;
            this.classes = function (cl) {
                $(self.e).addClass(cl);
                return self;
            }
            this.data = function (name, value) {
                $(self.e).attr('data-' + name, value);
                return self;
            }
            this.attr = function (name, value) {
                $(self.e).attr(name, value);
                return self;
            }
            this.css = function (name, value) {
                $(self.e).css(name, value);
                return self;
            }
            this.append = function (el) {
                $(self.e).append(el.e);
                return self;
            }
            this.text = function (tx) {
                $(self.e).append(document.createTextNode(tx));
                return self;
            }
            this.dom = function () {
                return self.e;
            }
            return this;
        }
        return new smoDomBuilder(el);
    }
	
	
}
