/**
 * Created by paquettepy on 2016-09-08.
 */

console.log("base_web_parser loaded");

function BaseWebParser(domain, url_pattern) {
    this.domain = domain;
    this.url_pattern = RegExp(url_pattern);
    this._page_types = new Map();
    var that = this;

    this.add_page_type("default", ".*", function(element) {
        results = [];
        console.log(that.url_pattern);
        console.log($(element));
        $(element).find("a[href]").each(function() {
            if(that.url_pattern.test(this.getAttribute("href"))) {
                results.push(this.getAttribute("href").replace(RegExp("#.+$"), ""));
            }
        });

        
        //.find("a[href*='" + that.url_pattern + "']").each(function() {
            //console.log(this);
            //if(RegExp(that.url_pattern).test($(this).attr("href"))) {
                //results.push($(this).attr("href"));                
            //}
        //});
        return results;
    });
    console.log(this._page_types);

}

/** ---Page type functionality
 * A page type is used to optimize or specify different queries for
 * parsing/scraping links off a page.
 */

 /* ---add_page_type
  */
BaseWebParser.prototype.add_page_type = function(type, regex, parse) {
    //var that = this;
    //if (!get_products) {
        //get_products = function(element) {
            //results = [];
            //$(element).find("[href*='" + that.url_pattern + "']").each(function() {
                //results.push($(this).attr("href"));
            //});
            //return results;
        //};
    //}

    // Save the default page type then delete it to reinsert it later (1)
    if(type != "default") {
        var def = this._page_types.get("default");
        console.log(def);
        this._page_types.delete("default");
        console.log(def);        
    }

    // Add the new page type
    this._page_types.set(type, {
        "allowed_urls": regex,
        "parse": parse
    });

    // Need the default page type to always be the last entry (2)
    if(def) {
        this._page_types.set("default", def)        
    }
}

/** ---Parser functionality
 * The parser's job is to scrape items off a page and organize it into
 * item objects (ideally similar to the model used by the database).
 */

/* ---get_products
 * This function takes an element, and, optionally, a page_type, and parses
 * it for product links. If a page_type is provided, the parser will abide
 * by the selectors specific to the page_type, otherwise, it will use the
 * default page_type. An array of names and links (empty if none are found)
 * is returned. On the other hand, if there is no valid or default page_type,
 * undefined is returned.
 * 
 * Arguments:
 *  element - the element to parse
 *  type - the type of the page to parse (search, browse, single, etc.)
 * 
 * Returns:
 *  An array of product names and links or undefined
 */
BaseWebParser.prototype.get_products = function(element, type) {
    var products;

    console.log("parse_page with type: " + type + " and element: ");
    console.log(element);
    // Get all the links from the page based on page_type
    if (this._page_types.get(type)) {
        products = this._page_types.get(type).parse(element);
    }

    // Check for a default page type if no valid page type is found
    if (!products) {
        if (this._page_types.get("default")) {
            "no valid page type, trying DEFAULT page_type"
            products = this._page_types.get("default").parse(element);
        }
        else {
            console.log("no valid or default page_type found!");            
        }
    }
    // Check for a default page type if no products are found with a valid page type
    else if (products.length == 0) {
        if (this._page_types.get("default")) {
            console.log("zero products found, trying DEFAULT page_type");
            products = this._page_types.get("default").parse(element);
        }
        else {
            console.log("zero products found with VALID page_type but NO default page_type found!");
        }
    }
    console.log("products found: ");
    console.log(_.uniq(products));
    return _.uniq(products)
};

/* ---get_page_type
 * This function takes a URL and determines whether or not it corresponds
 * to one of the known page types by using regex patterns. If a page type
 * is found, it is returned; if not, undefined is returned. If no argument
 * is provided, the URL of the page in which the web parser is injected
 * will be used.
 * 
 * Arguments:
 *  url - the url used in the matching
 * 
 * Returns:
 *  The page_type or undefined if none found
 */
BaseWebParser.prototype.get_page_type = function(url) {
    console.log("---get_page_type, url: " + url);
    if (!url) {
        url = window.location.href;
        console.log("no url provided, url is now: " + url);
    }
    var regex;
    var page_type;
    try {
        var BreakException = {};
        this._page_types.forEach(function(o, type) {
            console.log("searching for page_type: " + type + " '" + o.allowed_urls + "'");
            regex = new RegExp(o.allowed_urls);
            console.log(regex);
            if (regex.test(url)) {
                console.log("page type found: " + type);
                page_type = type;
                throw BreakException;
            }
        });        
    }
    catch(e) {
        console.log("broke out of loop");
        if(e !== BreakException) throw e;
    }
    return page_type;
};

/** ---Utility **/
