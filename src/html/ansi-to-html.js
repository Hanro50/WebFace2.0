/**
 * ansi-to-html: Licence 
 * Copyright (c) 2012 Rob Burns
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * 
 * entities: Licence 
 * Copyright (c) Felix Böhm
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 
 * THIS IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
let require = () => { }; require = (function () { function r(e, n, t) { function o(i, f) { if (!n[i]) { if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a; } var p = n[i] = { exports: {} }; e[i][0].call(p.exports, function (r) { var n = e[i][1][r]; return o(n || r); }, p, p.exports, r, e, n, t); } return n[i].exports; } for (var u = "function" == typeof require && require, i = 0; i < t.length; i++)o(t[i]); return o; } return r; })()({
  1: [function (require, module, exports) {
    "use strict";
    var __importDefault = (this && this.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decodeHTML = exports.decodeHTMLStrict = exports.decodeXML = void 0;
    var entities_json_1 = __importDefault(require("./maps/entities.json"));
    var legacy_json_1 = __importDefault(require("./maps/legacy.json"));
    var xml_json_1 = __importDefault(require("./maps/xml.json"));
    var decode_codepoint_1 = __importDefault(require("./decode_codepoint"));
    var strictEntityRe = /&(?:[a-zA-Z0-9]+|#[xX][\da-fA-F]+|#\d+);/g;
    exports.decodeXML = getStrictDecoder(xml_json_1.default);
    exports.decodeHTMLStrict = getStrictDecoder(entities_json_1.default);
    function getStrictDecoder(map) {
      var replace = getReplacer(map);
      return function (str) { return String(str).replace(strictEntityRe, replace); };
    }
    var sorter = function (a, b) { return (a < b ? 1 : -1); };
    exports.decodeHTML = (function () {
      var legacy = Object.keys(legacy_json_1.default).sort(sorter);
      var keys = Object.keys(entities_json_1.default).sort(sorter);
      for (var i = 0, j = 0; i < keys.length; i++) {
        if (legacy[j] === keys[i]) {
          keys[i] += ";?";
          j++;
        }
        else {
          keys[i] += ";";
        }
      }
      var re = new RegExp("&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g");
      var replace = getReplacer(entities_json_1.default);
      function replacer(str) {
        if (str.substr(-1) !== ";")
          str += ";";
        return replace(str);
      }
      return function (str) { return String(str).replace(re, replacer); };
    })();
    function getReplacer(map) {
      return function replace(str) {
        if (str.charAt(1) === "#") {
          var secondChar = str.charAt(2);
          if (secondChar === "X" || secondChar === "x") {
            return decode_codepoint_1.default(parseInt(str.substr(3), 16));
          }
          return decode_codepoint_1.default(parseInt(str.substr(2), 10));
        }
        return map[str.slice(1, -1)] || str;
      };
    }
  }, { "./decode_codepoint": 2, "./maps/entities.json": 6, "./maps/legacy.json": 7, "./maps/xml.json": 8 }], 2: [function (require, module, exports) {
    "use strict";
    var __importDefault = (this && this.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var decode_json_1 = __importDefault(require("./maps/decode.json"));
    var fromCodePoint = String.fromCodePoint ||
      function (codePoint) {
        var output = "";
        if (codePoint > 0xffff) {
          codePoint -= 0x10000;
          output += String.fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800);
          codePoint = 0xdc00 | (codePoint & 0x3ff);
        }
        output += String.fromCharCode(codePoint);
        return output;
      };
    function decodeCodePoint(codePoint) {
      if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
        return "\uFFFD";
      }
      if (codePoint in decode_json_1.default) {
        codePoint = decode_json_1.default[codePoint];
      }
      return fromCodePoint(codePoint);
    }
    exports.default = decodeCodePoint;
  }, { "./maps/decode.json": 5 }], 3: [function (require, module, exports) {
    "use strict";
    var __importDefault = (this && this.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.escapeUTF8 = exports.escape = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.encodeXML = void 0;
    var xml_json_1 = __importDefault(require("./maps/xml.json"));
    var inverseXML = getInverseObj(xml_json_1.default);
    var xmlReplacer = getInverseReplacer(inverseXML);
    exports.encodeXML = getASCIIEncoder(inverseXML);
    var entities_json_1 = __importDefault(require("./maps/entities.json"));
    var inverseHTML = getInverseObj(entities_json_1.default);
    var htmlReplacer = getInverseReplacer(inverseHTML);
    exports.encodeHTML = getInverse(inverseHTML, htmlReplacer);
    exports.encodeNonAsciiHTML = getASCIIEncoder(inverseHTML);
    function getInverseObj(obj) {
      return Object.keys(obj)
        .sort()
        .reduce(function (inverse, name) {
          inverse[obj[name]] = "&" + name + ";";
          return inverse;
        }, {});
    }
    function getInverseReplacer(inverse) {
      var single = [];
      var multiple = [];
      for (var _i = 0, _a = Object.keys(inverse); _i < _a.length; _i++) {
        var k = _a[_i];
        if (k.length === 1) {
          single.push("\\" + k);
        }
        else {
          multiple.push(k);
        }
      }
      single.sort();
      for (var start = 0; start < single.length - 1; start++) {
        var end = start;
        while (end < single.length - 1 &&
          single[end].charCodeAt(1) + 1 === single[end + 1].charCodeAt(1)) {
          end += 1;
        }
        var count = 1 + end - start;
        if (count < 3)
          continue;
        single.splice(start, count, single[start] + "-" + single[end]);
      }
      multiple.unshift("[" + single.join("") + "]");
      return new RegExp(multiple.join("|"), "g");
    }
    var reNonASCII = /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g;
    var getCodePoint = String.prototype.codePointAt != null
      ?
      function (str) { return str.codePointAt(0); }
      :
      function (c) {
        return (c.charCodeAt(0) - 0xd800) * 0x400 +
          c.charCodeAt(1) -
          0xdc00 +
          0x10000;
      };
    function singleCharReplacer(c) {
      return "&#x" + (c.length > 1 ? getCodePoint(c) : c.charCodeAt(0))
        .toString(16)
        .toUpperCase() + ";";
    }
    function getInverse(inverse, re) {
      return function (data) {
        return data
          .replace(re, function (name) { return inverse[name]; })
          .replace(reNonASCII, singleCharReplacer);
      };
    }
    var reEscapeChars = new RegExp(xmlReplacer.source + "|" + reNonASCII.source, "g");
    function escape(data) {
      return data.replace(reEscapeChars, singleCharReplacer);
    }
    exports.escape = escape;
    function escapeUTF8(data) {
      return data.replace(xmlReplacer, singleCharReplacer);
    }
    exports.escapeUTF8 = escapeUTF8;
    function getASCIIEncoder(obj) {
      return function (data) {
        return data.replace(reEscapeChars, function (c) { return obj[c] || singleCharReplacer(c); });
      };
    }
  }, { "./maps/entities.json": 6, "./maps/xml.json": 8 }], 4: [function (require, module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decodeXMLStrict = exports.decodeHTML5Strict = exports.decodeHTML4Strict = exports.decodeHTML5 = exports.decodeHTML4 = exports.decodeHTMLStrict = exports.decodeHTML = exports.decodeXML = exports.encodeHTML5 = exports.encodeHTML4 = exports.escapeUTF8 = exports.escape = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.encodeXML = exports.encode = exports.decodeStrict = exports.decode = void 0;
    var decode_1 = require("./decode");
    var encode_1 = require("./encode");
    function decode(data, level) {
      return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTML)(data);
    }
    exports.decode = decode;
    function decodeStrict(data, level) {
      return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTMLStrict)(data);
    }
    exports.decodeStrict = decodeStrict;
    function encode(data, level) {
      return (!level || level <= 0 ? encode_1.encodeXML : encode_1.encodeHTML)(data);
    }
    exports.encode = encode;
    var encode_2 = require("./encode");
    Object.defineProperty(exports, "encodeXML", { enumerable: true, get: function () { return encode_2.encodeXML; } });
    Object.defineProperty(exports, "encodeHTML", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
    Object.defineProperty(exports, "encodeNonAsciiHTML", { enumerable: true, get: function () { return encode_2.encodeNonAsciiHTML; } });
    Object.defineProperty(exports, "escape", { enumerable: true, get: function () { return encode_2.escape; } });
    Object.defineProperty(exports, "escapeUTF8", { enumerable: true, get: function () { return encode_2.escapeUTF8; } });
    Object.defineProperty(exports, "encodeHTML4", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
    Object.defineProperty(exports, "encodeHTML5", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
    var decode_2 = require("./decode");
    Object.defineProperty(exports, "decodeXML", { enumerable: true, get: function () { return decode_2.decodeXML; } });
    Object.defineProperty(exports, "decodeHTML", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
    Object.defineProperty(exports, "decodeHTMLStrict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
    Object.defineProperty(exports, "decodeHTML4", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
    Object.defineProperty(exports, "decodeHTML5", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
    Object.defineProperty(exports, "decodeHTML4Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
    Object.defineProperty(exports, "decodeHTML5Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
    Object.defineProperty(exports, "decodeXMLStrict", { enumerable: true, get: function () { return decode_2.decodeXML; } });
  }, { "./decode": 1, "./encode": 3 }], 5: [function (require, module, exports) {
    module.exports = { "0": 65533, "128": 8364, "130": 8218, "131": 402, "132": 8222, "133": 8230, "134": 8224, "135": 8225, "136": 710, "137": 8240, "138": 352, "139": 8249, "140": 338, "142": 381, "145": 8216, "146": 8217, "147": 8220, "148": 8221, "149": 8226, "150": 8211, "151": 8212, "152": 732, "153": 8482, "154": 353, "155": 8250, "156": 339, "158": 382, "159": 376 };
  }, {}], 6: [function (require, module, exports) {
    module.exports = { "Aacute": "Á", "aacute": "á", "Abreve": "Ă", "abreve": "ă", "ac": "∾", "acd": "∿", "acE": "∾̳", "Acirc": "Â", "acirc": "â", "acute": "´", "Acy": "А", "acy": "а", "AElig": "Æ", "aelig": "æ", "af": "⁡", "Afr": "𝔄", "afr": "𝔞", "Agrave": "À", "agrave": "à", "alefsym": "ℵ", "aleph": "ℵ", "Alpha": "Α", "alpha": "α", "Amacr": "Ā", "amacr": "ā", "amalg": "⨿", "amp": "&", "AMP": "&", "andand": "⩕", "And": "⩓", "and": "∧", "andd": "⩜", "andslope": "⩘", "andv": "⩚", "ang": "∠", "ange": "⦤", "angle": "∠", "angmsdaa": "⦨", "angmsdab": "⦩", "angmsdac": "⦪", "angmsdad": "⦫", "angmsdae": "⦬", "angmsdaf": "⦭", "angmsdag": "⦮", "angmsdah": "⦯", "angmsd": "∡", "angrt": "∟", "angrtvb": "⊾", "angrtvbd": "⦝", "angsph": "∢", "angst": "Å", "angzarr": "⍼", "Aogon": "Ą", "aogon": "ą", "Aopf": "𝔸", "aopf": "𝕒", "apacir": "⩯", "ap": "≈", "apE": "⩰", "ape": "≊", "apid": "≋", "apos": "'", "ApplyFunction": "⁡", "approx": "≈", "approxeq": "≊", "Aring": "Å", "aring": "å", "Ascr": "𝒜", "ascr": "𝒶", "Assign": "≔", "ast": "*", "asymp": "≈", "asympeq": "≍", "Atilde": "Ã", "atilde": "ã", "Auml": "Ä", "auml": "ä", "awconint": "∳", "awint": "⨑", "backcong": "≌", "backepsilon": "϶", "backprime": "‵", "backsim": "∽", "backsimeq": "⋍", "Backslash": "∖", "Barv": "⫧", "barvee": "⊽", "barwed": "⌅", "Barwed": "⌆", "barwedge": "⌅", "bbrk": "⎵", "bbrktbrk": "⎶", "bcong": "≌", "Bcy": "Б", "bcy": "б", "bdquo": "„", "becaus": "∵", "because": "∵", "Because": "∵", "bemptyv": "⦰", "bepsi": "϶", "bernou": "ℬ", "Bernoullis": "ℬ", "Beta": "Β", "beta": "β", "beth": "ℶ", "between": "≬", "Bfr": "𝔅", "bfr": "𝔟", "bigcap": "⋂", "bigcirc": "◯", "bigcup": "⋃", "bigodot": "⨀", "bigoplus": "⨁", "bigotimes": "⨂", "bigsqcup": "⨆", "bigstar": "★", "bigtriangledown": "▽", "bigtriangleup": "△", "biguplus": "⨄", "bigvee": "⋁", "bigwedge": "⋀", "bkarow": "⤍", "blacklozenge": "⧫", "blacksquare": "▪", "blacktriangle": "▴", "blacktriangledown": "▾", "blacktriangleleft": "◂", "blacktriangleright": "▸", "blank": "␣", "blk12": "▒", "blk14": "░", "blk34": "▓", "block": "█", "bne": "=⃥", "bnequiv": "≡⃥", "bNot": "⫭", "bnot": "⌐", "Bopf": "𝔹", "bopf": "𝕓", "bot": "⊥", "bottom": "⊥", "bowtie": "⋈", "boxbox": "⧉", "boxdl": "┐", "boxdL": "╕", "boxDl": "╖", "boxDL": "╗", "boxdr": "┌", "boxdR": "╒", "boxDr": "╓", "boxDR": "╔", "boxh": "─", "boxH": "═", "boxhd": "┬", "boxHd": "╤", "boxhD": "╥", "boxHD": "╦", "boxhu": "┴", "boxHu": "╧", "boxhU": "╨", "boxHU": "╩", "boxminus": "⊟", "boxplus": "⊞", "boxtimes": "⊠", "boxul": "┘", "boxuL": "╛", "boxUl": "╜", "boxUL": "╝", "boxur": "└", "boxuR": "╘", "boxUr": "╙", "boxUR": "╚", "boxv": "│", "boxV": "║", "boxvh": "┼", "boxvH": "╪", "boxVh": "╫", "boxVH": "╬", "boxvl": "┤", "boxvL": "╡", "boxVl": "╢", "boxVL": "╣", "boxvr": "├", "boxvR": "╞", "boxVr": "╟", "boxVR": "╠", "bprime": "‵", "breve": "˘", "Breve": "˘", "brvbar": "¦", "bscr": "𝒷", "Bscr": "ℬ", "bsemi": "⁏", "bsim": "∽", "bsime": "⋍", "bsolb": "⧅", "bsol": "\\", "bsolhsub": "⟈", "bull": "•", "bullet": "•", "bump": "≎", "bumpE": "⪮", "bumpe": "≏", "Bumpeq": "≎", "bumpeq": "≏", "Cacute": "Ć", "cacute": "ć", "capand": "⩄", "capbrcup": "⩉", "capcap": "⩋", "cap": "∩", "Cap": "⋒", "capcup": "⩇", "capdot": "⩀", "CapitalDifferentialD": "ⅅ", "caps": "∩︀", "caret": "⁁", "caron": "ˇ", "Cayleys": "ℭ", "ccaps": "⩍", "Ccaron": "Č", "ccaron": "č", "Ccedil": "Ç", "ccedil": "ç", "Ccirc": "Ĉ", "ccirc": "ĉ", "Cconint": "∰", "ccups": "⩌", "ccupssm": "⩐", "Cdot": "Ċ", "cdot": "ċ", "cedil": "¸", "Cedilla": "¸", "cemptyv": "⦲", "cent": "¢", "centerdot": "·", "CenterDot": "·", "cfr": "𝔠", "Cfr": "ℭ", "CHcy": "Ч", "chcy": "ч", "check": "✓", "checkmark": "✓", "Chi": "Χ", "chi": "χ", "circ": "ˆ", "circeq": "≗", "circlearrowleft": "↺", "circlearrowright": "↻", "circledast": "⊛", "circledcirc": "⊚", "circleddash": "⊝", "CircleDot": "⊙", "circledR": "®", "circledS": "Ⓢ", "CircleMinus": "⊖", "CirclePlus": "⊕", "CircleTimes": "⊗", "cir": "○", "cirE": "⧃", "cire": "≗", "cirfnint": "⨐", "cirmid": "⫯", "cirscir": "⧂", "ClockwiseContourIntegral": "∲", "CloseCurlyDoubleQuote": "”", "CloseCurlyQuote": "’", "clubs": "♣", "clubsuit": "♣", "colon": ":", "Colon": "∷", "Colone": "⩴", "colone": "≔", "coloneq": "≔", "comma": ",", "commat": "@", "comp": "∁", "compfn": "∘", "complement": "∁", "complexes": "ℂ", "cong": "≅", "congdot": "⩭", "Congruent": "≡", "conint": "∮", "Conint": "∯", "ContourIntegral": "∮", "copf": "𝕔", "Copf": "ℂ", "coprod": "∐", "Coproduct": "∐", "copy": "©", "COPY": "©", "copysr": "℗", "CounterClockwiseContourIntegral": "∳", "crarr": "↵", "cross": "✗", "Cross": "⨯", "Cscr": "𝒞", "cscr": "𝒸", "csub": "⫏", "csube": "⫑", "csup": "⫐", "csupe": "⫒", "ctdot": "⋯", "cudarrl": "⤸", "cudarrr": "⤵", "cuepr": "⋞", "cuesc": "⋟", "cularr": "↶", "cularrp": "⤽", "cupbrcap": "⩈", "cupcap": "⩆", "CupCap": "≍", "cup": "∪", "Cup": "⋓", "cupcup": "⩊", "cupdot": "⊍", "cupor": "⩅", "cups": "∪︀", "curarr": "↷", "curarrm": "⤼", "curlyeqprec": "⋞", "curlyeqsucc": "⋟", "curlyvee": "⋎", "curlywedge": "⋏", "curren": "¤", "curvearrowleft": "↶", "curvearrowright": "↷", "cuvee": "⋎", "cuwed": "⋏", "cwconint": "∲", "cwint": "∱", "cylcty": "⌭", "dagger": "†", "Dagger": "‡", "daleth": "ℸ", "darr": "↓", "Darr": "↡", "dArr": "⇓", "dash": "‐", "Dashv": "⫤", "dashv": "⊣", "dbkarow": "⤏", "dblac": "˝", "Dcaron": "Ď", "dcaron": "ď", "Dcy": "Д", "dcy": "д", "ddagger": "‡", "ddarr": "⇊", "DD": "ⅅ", "dd": "ⅆ", "DDotrahd": "⤑", "ddotseq": "⩷", "deg": "°", "Del": "∇", "Delta": "Δ", "delta": "δ", "demptyv": "⦱", "dfisht": "⥿", "Dfr": "𝔇", "dfr": "𝔡", "dHar": "⥥", "dharl": "⇃", "dharr": "⇂", "DiacriticalAcute": "´", "DiacriticalDot": "˙", "DiacriticalDoubleAcute": "˝", "DiacriticalGrave": "`", "DiacriticalTilde": "˜", "diam": "⋄", "diamond": "⋄", "Diamond": "⋄", "diamondsuit": "♦", "diams": "♦", "die": "¨", "DifferentialD": "ⅆ", "digamma": "ϝ", "disin": "⋲", "div": "÷", "divide": "÷", "divideontimes": "⋇", "divonx": "⋇", "DJcy": "Ђ", "djcy": "ђ", "dlcorn": "⌞", "dlcrop": "⌍", "dollar": "$", "Dopf": "𝔻", "dopf": "𝕕", "Dot": "¨", "dot": "˙", "DotDot": "⃜", "doteq": "≐", "doteqdot": "≑", "DotEqual": "≐", "dotminus": "∸", "dotplus": "∔", "dotsquare": "⊡", "doublebarwedge": "⌆", "DoubleContourIntegral": "∯", "DoubleDot": "¨", "DoubleDownArrow": "⇓", "DoubleLeftArrow": "⇐", "DoubleLeftRightArrow": "⇔", "DoubleLeftTee": "⫤", "DoubleLongLeftArrow": "⟸", "DoubleLongLeftRightArrow": "⟺", "DoubleLongRightArrow": "⟹", "DoubleRightArrow": "⇒", "DoubleRightTee": "⊨", "DoubleUpArrow": "⇑", "DoubleUpDownArrow": "⇕", "DoubleVerticalBar": "∥", "DownArrowBar": "⤓", "downarrow": "↓", "DownArrow": "↓", "Downarrow": "⇓", "DownArrowUpArrow": "⇵", "DownBreve": "̑", "downdownarrows": "⇊", "downharpoonleft": "⇃", "downharpoonright": "⇂", "DownLeftRightVector": "⥐", "DownLeftTeeVector": "⥞", "DownLeftVectorBar": "⥖", "DownLeftVector": "↽", "DownRightTeeVector": "⥟", "DownRightVectorBar": "⥗", "DownRightVector": "⇁", "DownTeeArrow": "↧", "DownTee": "⊤", "drbkarow": "⤐", "drcorn": "⌟", "drcrop": "⌌", "Dscr": "𝒟", "dscr": "𝒹", "DScy": "Ѕ", "dscy": "ѕ", "dsol": "⧶", "Dstrok": "Đ", "dstrok": "đ", "dtdot": "⋱", "dtri": "▿", "dtrif": "▾", "duarr": "⇵", "duhar": "⥯", "dwangle": "⦦", "DZcy": "Џ", "dzcy": "џ", "dzigrarr": "⟿", "Eacute": "É", "eacute": "é", "easter": "⩮", "Ecaron": "Ě", "ecaron": "ě", "Ecirc": "Ê", "ecirc": "ê", "ecir": "≖", "ecolon": "≕", "Ecy": "Э", "ecy": "э", "eDDot": "⩷", "Edot": "Ė", "edot": "ė", "eDot": "≑", "ee": "ⅇ", "efDot": "≒", "Efr": "𝔈", "efr": "𝔢", "eg": "⪚", "Egrave": "È", "egrave": "è", "egs": "⪖", "egsdot": "⪘", "el": "⪙", "Element": "∈", "elinters": "⏧", "ell": "ℓ", "els": "⪕", "elsdot": "⪗", "Emacr": "Ē", "emacr": "ē", "empty": "∅", "emptyset": "∅", "EmptySmallSquare": "◻", "emptyv": "∅", "EmptyVerySmallSquare": "▫", "emsp13": " ", "emsp14": " ", "emsp": " ", "ENG": "Ŋ", "eng": "ŋ", "ensp": " ", "Eogon": "Ę", "eogon": "ę", "Eopf": "𝔼", "eopf": "𝕖", "epar": "⋕", "eparsl": "⧣", "eplus": "⩱", "epsi": "ε", "Epsilon": "Ε", "epsilon": "ε", "epsiv": "ϵ", "eqcirc": "≖", "eqcolon": "≕", "eqsim": "≂", "eqslantgtr": "⪖", "eqslantless": "⪕", "Equal": "⩵", "equals": "=", "EqualTilde": "≂", "equest": "≟", "Equilibrium": "⇌", "equiv": "≡", "equivDD": "⩸", "eqvparsl": "⧥", "erarr": "⥱", "erDot": "≓", "escr": "ℯ", "Escr": "ℰ", "esdot": "≐", "Esim": "⩳", "esim": "≂", "Eta": "Η", "eta": "η", "ETH": "Ð", "eth": "ð", "Euml": "Ë", "euml": "ë", "euro": "€", "excl": "!", "exist": "∃", "Exists": "∃", "expectation": "ℰ", "exponentiale": "ⅇ", "ExponentialE": "ⅇ", "fallingdotseq": "≒", "Fcy": "Ф", "fcy": "ф", "female": "♀", "ffilig": "ﬃ", "fflig": "ﬀ", "ffllig": "ﬄ", "Ffr": "𝔉", "ffr": "𝔣", "filig": "ﬁ", "FilledSmallSquare": "◼", "FilledVerySmallSquare": "▪", "fjlig": "fj", "flat": "♭", "fllig": "ﬂ", "fltns": "▱", "fnof": "ƒ", "Fopf": "𝔽", "fopf": "𝕗", "forall": "∀", "ForAll": "∀", "fork": "⋔", "forkv": "⫙", "Fouriertrf": "ℱ", "fpartint": "⨍", "frac12": "½", "frac13": "⅓", "frac14": "¼", "frac15": "⅕", "frac16": "⅙", "frac18": "⅛", "frac23": "⅔", "frac25": "⅖", "frac34": "¾", "frac35": "⅗", "frac38": "⅜", "frac45": "⅘", "frac56": "⅚", "frac58": "⅝", "frac78": "⅞", "frasl": "⁄", "frown": "⌢", "fscr": "𝒻", "Fscr": "ℱ", "gacute": "ǵ", "Gamma": "Γ", "gamma": "γ", "Gammad": "Ϝ", "gammad": "ϝ", "gap": "⪆", "Gbreve": "Ğ", "gbreve": "ğ", "Gcedil": "Ģ", "Gcirc": "Ĝ", "gcirc": "ĝ", "Gcy": "Г", "gcy": "г", "Gdot": "Ġ", "gdot": "ġ", "ge": "≥", "gE": "≧", "gEl": "⪌", "gel": "⋛", "geq": "≥", "geqq": "≧", "geqslant": "⩾", "gescc": "⪩", "ges": "⩾", "gesdot": "⪀", "gesdoto": "⪂", "gesdotol": "⪄", "gesl": "⋛︀", "gesles": "⪔", "Gfr": "𝔊", "gfr": "𝔤", "gg": "≫", "Gg": "⋙", "ggg": "⋙", "gimel": "ℷ", "GJcy": "Ѓ", "gjcy": "ѓ", "gla": "⪥", "gl": "≷", "glE": "⪒", "glj": "⪤", "gnap": "⪊", "gnapprox": "⪊", "gne": "⪈", "gnE": "≩", "gneq": "⪈", "gneqq": "≩", "gnsim": "⋧", "Gopf": "𝔾", "gopf": "𝕘", "grave": "`", "GreaterEqual": "≥", "GreaterEqualLess": "⋛", "GreaterFullEqual": "≧", "GreaterGreater": "⪢", "GreaterLess": "≷", "GreaterSlantEqual": "⩾", "GreaterTilde": "≳", "Gscr": "𝒢", "gscr": "ℊ", "gsim": "≳", "gsime": "⪎", "gsiml": "⪐", "gtcc": "⪧", "gtcir": "⩺", "gt": ">", "GT": ">", "Gt": "≫", "gtdot": "⋗", "gtlPar": "⦕", "gtquest": "⩼", "gtrapprox": "⪆", "gtrarr": "⥸", "gtrdot": "⋗", "gtreqless": "⋛", "gtreqqless": "⪌", "gtrless": "≷", "gtrsim": "≳", "gvertneqq": "≩︀", "gvnE": "≩︀", "Hacek": "ˇ", "hairsp": " ", "half": "½", "hamilt": "ℋ", "HARDcy": "Ъ", "hardcy": "ъ", "harrcir": "⥈", "harr": "↔", "hArr": "⇔", "harrw": "↭", "Hat": "^", "hbar": "ℏ", "Hcirc": "Ĥ", "hcirc": "ĥ", "hearts": "♥", "heartsuit": "♥", "hellip": "…", "hercon": "⊹", "hfr": "𝔥", "Hfr": "ℌ", "HilbertSpace": "ℋ", "hksearow": "⤥", "hkswarow": "⤦", "hoarr": "⇿", "homtht": "∻", "hookleftarrow": "↩", "hookrightarrow": "↪", "hopf": "𝕙", "Hopf": "ℍ", "horbar": "―", "HorizontalLine": "─", "hscr": "𝒽", "Hscr": "ℋ", "hslash": "ℏ", "Hstrok": "Ħ", "hstrok": "ħ", "HumpDownHump": "≎", "HumpEqual": "≏", "hybull": "⁃", "hyphen": "‐", "Iacute": "Í", "iacute": "í", "ic": "⁣", "Icirc": "Î", "icirc": "î", "Icy": "И", "icy": "и", "Idot": "İ", "IEcy": "Е", "iecy": "е", "iexcl": "¡", "iff": "⇔", "ifr": "𝔦", "Ifr": "ℑ", "Igrave": "Ì", "igrave": "ì", "ii": "ⅈ", "iiiint": "⨌", "iiint": "∭", "iinfin": "⧜", "iiota": "℩", "IJlig": "Ĳ", "ijlig": "ĳ", "Imacr": "Ī", "imacr": "ī", "image": "ℑ", "ImaginaryI": "ⅈ", "imagline": "ℐ", "imagpart": "ℑ", "imath": "ı", "Im": "ℑ", "imof": "⊷", "imped": "Ƶ", "Implies": "⇒", "incare": "℅", "in": "∈", "infin": "∞", "infintie": "⧝", "inodot": "ı", "intcal": "⊺", "int": "∫", "Int": "∬", "integers": "ℤ", "Integral": "∫", "intercal": "⊺", "Intersection": "⋂", "intlarhk": "⨗", "intprod": "⨼", "InvisibleComma": "⁣", "InvisibleTimes": "⁢", "IOcy": "Ё", "iocy": "ё", "Iogon": "Į", "iogon": "į", "Iopf": "𝕀", "iopf": "𝕚", "Iota": "Ι", "iota": "ι", "iprod": "⨼", "iquest": "¿", "iscr": "𝒾", "Iscr": "ℐ", "isin": "∈", "isindot": "⋵", "isinE": "⋹", "isins": "⋴", "isinsv": "⋳", "isinv": "∈", "it": "⁢", "Itilde": "Ĩ", "itilde": "ĩ", "Iukcy": "І", "iukcy": "і", "Iuml": "Ï", "iuml": "ï", "Jcirc": "Ĵ", "jcirc": "ĵ", "Jcy": "Й", "jcy": "й", "Jfr": "𝔍", "jfr": "𝔧", "jmath": "ȷ", "Jopf": "𝕁", "jopf": "𝕛", "Jscr": "𝒥", "jscr": "𝒿", "Jsercy": "Ј", "jsercy": "ј", "Jukcy": "Є", "jukcy": "є", "Kappa": "Κ", "kappa": "κ", "kappav": "ϰ", "Kcedil": "Ķ", "kcedil": "ķ", "Kcy": "К", "kcy": "к", "Kfr": "𝔎", "kfr": "𝔨", "kgreen": "ĸ", "KHcy": "Х", "khcy": "х", "KJcy": "Ќ", "kjcy": "ќ", "Kopf": "𝕂", "kopf": "𝕜", "Kscr": "𝒦", "kscr": "𝓀", "lAarr": "⇚", "Lacute": "Ĺ", "lacute": "ĺ", "laemptyv": "⦴", "lagran": "ℒ", "Lambda": "Λ", "lambda": "λ", "lang": "⟨", "Lang": "⟪", "langd": "⦑", "langle": "⟨", "lap": "⪅", "Laplacetrf": "ℒ", "laquo": "«", "larrb": "⇤", "larrbfs": "⤟", "larr": "←", "Larr": "↞", "lArr": "⇐", "larrfs": "⤝", "larrhk": "↩", "larrlp": "↫", "larrpl": "⤹", "larrsim": "⥳", "larrtl": "↢", "latail": "⤙", "lAtail": "⤛", "lat": "⪫", "late": "⪭", "lates": "⪭︀", "lbarr": "⤌", "lBarr": "⤎", "lbbrk": "❲", "lbrace": "{", "lbrack": "[", "lbrke": "⦋", "lbrksld": "⦏", "lbrkslu": "⦍", "Lcaron": "Ľ", "lcaron": "ľ", "Lcedil": "Ļ", "lcedil": "ļ", "lceil": "⌈", "lcub": "{", "Lcy": "Л", "lcy": "л", "ldca": "⤶", "ldquo": "“", "ldquor": "„", "ldrdhar": "⥧", "ldrushar": "⥋", "ldsh": "↲", "le": "≤", "lE": "≦", "LeftAngleBracket": "⟨", "LeftArrowBar": "⇤", "leftarrow": "←", "LeftArrow": "←", "Leftarrow": "⇐", "LeftArrowRightArrow": "⇆", "leftarrowtail": "↢", "LeftCeiling": "⌈", "LeftDoubleBracket": "⟦", "LeftDownTeeVector": "⥡", "LeftDownVectorBar": "⥙", "LeftDownVector": "⇃", "LeftFloor": "⌊", "leftharpoondown": "↽", "leftharpoonup": "↼", "leftleftarrows": "⇇", "leftrightarrow": "↔", "LeftRightArrow": "↔", "Leftrightarrow": "⇔", "leftrightarrows": "⇆", "leftrightharpoons": "⇋", "leftrightsquigarrow": "↭", "LeftRightVector": "⥎", "LeftTeeArrow": "↤", "LeftTee": "⊣", "LeftTeeVector": "⥚", "leftthreetimes": "⋋", "LeftTriangleBar": "⧏", "LeftTriangle": "⊲", "LeftTriangleEqual": "⊴", "LeftUpDownVector": "⥑", "LeftUpTeeVector": "⥠", "LeftUpVectorBar": "⥘", "LeftUpVector": "↿", "LeftVectorBar": "⥒", "LeftVector": "↼", "lEg": "⪋", "leg": "⋚", "leq": "≤", "leqq": "≦", "leqslant": "⩽", "lescc": "⪨", "les": "⩽", "lesdot": "⩿", "lesdoto": "⪁", "lesdotor": "⪃", "lesg": "⋚︀", "lesges": "⪓", "lessapprox": "⪅", "lessdot": "⋖", "lesseqgtr": "⋚", "lesseqqgtr": "⪋", "LessEqualGreater": "⋚", "LessFullEqual": "≦", "LessGreater": "≶", "lessgtr": "≶", "LessLess": "⪡", "lesssim": "≲", "LessSlantEqual": "⩽", "LessTilde": "≲", "lfisht": "⥼", "lfloor": "⌊", "Lfr": "𝔏", "lfr": "𝔩", "lg": "≶", "lgE": "⪑", "lHar": "⥢", "lhard": "↽", "lharu": "↼", "lharul": "⥪", "lhblk": "▄", "LJcy": "Љ", "ljcy": "љ", "llarr": "⇇", "ll": "≪", "Ll": "⋘", "llcorner": "⌞", "Lleftarrow": "⇚", "llhard": "⥫", "lltri": "◺", "Lmidot": "Ŀ", "lmidot": "ŀ", "lmoustache": "⎰", "lmoust": "⎰", "lnap": "⪉", "lnapprox": "⪉", "lne": "⪇", "lnE": "≨", "lneq": "⪇", "lneqq": "≨", "lnsim": "⋦", "loang": "⟬", "loarr": "⇽", "lobrk": "⟦", "longleftarrow": "⟵", "LongLeftArrow": "⟵", "Longleftarrow": "⟸", "longleftrightarrow": "⟷", "LongLeftRightArrow": "⟷", "Longleftrightarrow": "⟺", "longmapsto": "⟼", "longrightarrow": "⟶", "LongRightArrow": "⟶", "Longrightarrow": "⟹", "looparrowleft": "↫", "looparrowright": "↬", "lopar": "⦅", "Lopf": "𝕃", "lopf": "𝕝", "loplus": "⨭", "lotimes": "⨴", "lowast": "∗", "lowbar": "_", "LowerLeftArrow": "↙", "LowerRightArrow": "↘", "loz": "◊", "lozenge": "◊", "lozf": "⧫", "lpar": "(", "lparlt": "⦓", "lrarr": "⇆", "lrcorner": "⌟", "lrhar": "⇋", "lrhard": "⥭", "lrm": "‎", "lrtri": "⊿", "lsaquo": "‹", "lscr": "𝓁", "Lscr": "ℒ", "lsh": "↰", "Lsh": "↰", "lsim": "≲", "lsime": "⪍", "lsimg": "⪏", "lsqb": "[", "lsquo": "‘", "lsquor": "‚", "Lstrok": "Ł", "lstrok": "ł", "ltcc": "⪦", "ltcir": "⩹", "lt": "<", "LT": "<", "Lt": "≪", "ltdot": "⋖", "lthree": "⋋", "ltimes": "⋉", "ltlarr": "⥶", "ltquest": "⩻", "ltri": "◃", "ltrie": "⊴", "ltrif": "◂", "ltrPar": "⦖", "lurdshar": "⥊", "luruhar": "⥦", "lvertneqq": "≨︀", "lvnE": "≨︀", "macr": "¯", "male": "♂", "malt": "✠", "maltese": "✠", "Map": "⤅", "map": "↦", "mapsto": "↦", "mapstodown": "↧", "mapstoleft": "↤", "mapstoup": "↥", "marker": "▮", "mcomma": "⨩", "Mcy": "М", "mcy": "м", "mdash": "—", "mDDot": "∺", "measuredangle": "∡", "MediumSpace": " ", "Mellintrf": "ℳ", "Mfr": "𝔐", "mfr": "𝔪", "mho": "℧", "micro": "µ", "midast": "*", "midcir": "⫰", "mid": "∣", "middot": "·", "minusb": "⊟", "minus": "−", "minusd": "∸", "minusdu": "⨪", "MinusPlus": "∓", "mlcp": "⫛", "mldr": "…", "mnplus": "∓", "models": "⊧", "Mopf": "𝕄", "mopf": "𝕞", "mp": "∓", "mscr": "𝓂", "Mscr": "ℳ", "mstpos": "∾", "Mu": "Μ", "mu": "μ", "multimap": "⊸", "mumap": "⊸", "nabla": "∇", "Nacute": "Ń", "nacute": "ń", "nang": "∠⃒", "nap": "≉", "napE": "⩰̸", "napid": "≋̸", "napos": "ŉ", "napprox": "≉", "natural": "♮", "naturals": "ℕ", "natur": "♮", "nbsp": " ", "nbump": "≎̸", "nbumpe": "≏̸", "ncap": "⩃", "Ncaron": "Ň", "ncaron": "ň", "Ncedil": "Ņ", "ncedil": "ņ", "ncong": "≇", "ncongdot": "⩭̸", "ncup": "⩂", "Ncy": "Н", "ncy": "н", "ndash": "–", "nearhk": "⤤", "nearr": "↗", "neArr": "⇗", "nearrow": "↗", "ne": "≠", "nedot": "≐̸", "NegativeMediumSpace": "​", "NegativeThickSpace": "​", "NegativeThinSpace": "​", "NegativeVeryThinSpace": "​", "nequiv": "≢", "nesear": "⤨", "nesim": "≂̸", "NestedGreaterGreater": "≫", "NestedLessLess": "≪", "NewLine": "\n", "nexist": "∄", "nexists": "∄", "Nfr": "𝔑", "nfr": "𝔫", "ngE": "≧̸", "nge": "≱", "ngeq": "≱", "ngeqq": "≧̸", "ngeqslant": "⩾̸", "nges": "⩾̸", "nGg": "⋙̸", "ngsim": "≵", "nGt": "≫⃒", "ngt": "≯", "ngtr": "≯", "nGtv": "≫̸", "nharr": "↮", "nhArr": "⇎", "nhpar": "⫲", "ni": "∋", "nis": "⋼", "nisd": "⋺", "niv": "∋", "NJcy": "Њ", "njcy": "њ", "nlarr": "↚", "nlArr": "⇍", "nldr": "‥", "nlE": "≦̸", "nle": "≰", "nleftarrow": "↚", "nLeftarrow": "⇍", "nleftrightarrow": "↮", "nLeftrightarrow": "⇎", "nleq": "≰", "nleqq": "≦̸", "nleqslant": "⩽̸", "nles": "⩽̸", "nless": "≮", "nLl": "⋘̸", "nlsim": "≴", "nLt": "≪⃒", "nlt": "≮", "nltri": "⋪", "nltrie": "⋬", "nLtv": "≪̸", "nmid": "∤", "NoBreak": "⁠", "NonBreakingSpace": " ", "nopf": "𝕟", "Nopf": "ℕ", "Not": "⫬", "not": "¬", "NotCongruent": "≢", "NotCupCap": "≭", "NotDoubleVerticalBar": "∦", "NotElement": "∉", "NotEqual": "≠", "NotEqualTilde": "≂̸", "NotExists": "∄", "NotGreater": "≯", "NotGreaterEqual": "≱", "NotGreaterFullEqual": "≧̸", "NotGreaterGreater": "≫̸", "NotGreaterLess": "≹", "NotGreaterSlantEqual": "⩾̸", "NotGreaterTilde": "≵", "NotHumpDownHump": "≎̸", "NotHumpEqual": "≏̸", "notin": "∉", "notindot": "⋵̸", "notinE": "⋹̸", "notinva": "∉", "notinvb": "⋷", "notinvc": "⋶", "NotLeftTriangleBar": "⧏̸", "NotLeftTriangle": "⋪", "NotLeftTriangleEqual": "⋬", "NotLess": "≮", "NotLessEqual": "≰", "NotLessGreater": "≸", "NotLessLess": "≪̸", "NotLessSlantEqual": "⩽̸", "NotLessTilde": "≴", "NotNestedGreaterGreater": "⪢̸", "NotNestedLessLess": "⪡̸", "notni": "∌", "notniva": "∌", "notnivb": "⋾", "notnivc": "⋽", "NotPrecedes": "⊀", "NotPrecedesEqual": "⪯̸", "NotPrecedesSlantEqual": "⋠", "NotReverseElement": "∌", "NotRightTriangleBar": "⧐̸", "NotRightTriangle": "⋫", "NotRightTriangleEqual": "⋭", "NotSquareSubset": "⊏̸", "NotSquareSubsetEqual": "⋢", "NotSquareSuperset": "⊐̸", "NotSquareSupersetEqual": "⋣", "NotSubset": "⊂⃒", "NotSubsetEqual": "⊈", "NotSucceeds": "⊁", "NotSucceedsEqual": "⪰̸", "NotSucceedsSlantEqual": "⋡", "NotSucceedsTilde": "≿̸", "NotSuperset": "⊃⃒", "NotSupersetEqual": "⊉", "NotTilde": "≁", "NotTildeEqual": "≄", "NotTildeFullEqual": "≇", "NotTildeTilde": "≉", "NotVerticalBar": "∤", "nparallel": "∦", "npar": "∦", "nparsl": "⫽⃥", "npart": "∂̸", "npolint": "⨔", "npr": "⊀", "nprcue": "⋠", "nprec": "⊀", "npreceq": "⪯̸", "npre": "⪯̸", "nrarrc": "⤳̸", "nrarr": "↛", "nrArr": "⇏", "nrarrw": "↝̸", "nrightarrow": "↛", "nRightarrow": "⇏", "nrtri": "⋫", "nrtrie": "⋭", "nsc": "⊁", "nsccue": "⋡", "nsce": "⪰̸", "Nscr": "𝒩", "nscr": "𝓃", "nshortmid": "∤", "nshortparallel": "∦", "nsim": "≁", "nsime": "≄", "nsimeq": "≄", "nsmid": "∤", "nspar": "∦", "nsqsube": "⋢", "nsqsupe": "⋣", "nsub": "⊄", "nsubE": "⫅̸", "nsube": "⊈", "nsubset": "⊂⃒", "nsubseteq": "⊈", "nsubseteqq": "⫅̸", "nsucc": "⊁", "nsucceq": "⪰̸", "nsup": "⊅", "nsupE": "⫆̸", "nsupe": "⊉", "nsupset": "⊃⃒", "nsupseteq": "⊉", "nsupseteqq": "⫆̸", "ntgl": "≹", "Ntilde": "Ñ", "ntilde": "ñ", "ntlg": "≸", "ntriangleleft": "⋪", "ntrianglelefteq": "⋬", "ntriangleright": "⋫", "ntrianglerighteq": "⋭", "Nu": "Ν", "nu": "ν", "num": "#", "numero": "№", "numsp": " ", "nvap": "≍⃒", "nvdash": "⊬", "nvDash": "⊭", "nVdash": "⊮", "nVDash": "⊯", "nvge": "≥⃒", "nvgt": ">⃒", "nvHarr": "⤄", "nvinfin": "⧞", "nvlArr": "⤂", "nvle": "≤⃒", "nvlt": "<⃒", "nvltrie": "⊴⃒", "nvrArr": "⤃", "nvrtrie": "⊵⃒", "nvsim": "∼⃒", "nwarhk": "⤣", "nwarr": "↖", "nwArr": "⇖", "nwarrow": "↖", "nwnear": "⤧", "Oacute": "Ó", "oacute": "ó", "oast": "⊛", "Ocirc": "Ô", "ocirc": "ô", "ocir": "⊚", "Ocy": "О", "ocy": "о", "odash": "⊝", "Odblac": "Ő", "odblac": "ő", "odiv": "⨸", "odot": "⊙", "odsold": "⦼", "OElig": "Œ", "oelig": "œ", "ofcir": "⦿", "Ofr": "𝔒", "ofr": "𝔬", "ogon": "˛", "Ograve": "Ò", "ograve": "ò", "ogt": "⧁", "ohbar": "⦵", "ohm": "Ω", "oint": "∮", "olarr": "↺", "olcir": "⦾", "olcross": "⦻", "oline": "‾", "olt": "⧀", "Omacr": "Ō", "omacr": "ō", "Omega": "Ω", "omega": "ω", "Omicron": "Ο", "omicron": "ο", "omid": "⦶", "ominus": "⊖", "Oopf": "𝕆", "oopf": "𝕠", "opar": "⦷", "OpenCurlyDoubleQuote": "“", "OpenCurlyQuote": "‘", "operp": "⦹", "oplus": "⊕", "orarr": "↻", "Or": "⩔", "or": "∨", "ord": "⩝", "order": "ℴ", "orderof": "ℴ", "ordf": "ª", "ordm": "º", "origof": "⊶", "oror": "⩖", "orslope": "⩗", "orv": "⩛", "oS": "Ⓢ", "Oscr": "𝒪", "oscr": "ℴ", "Oslash": "Ø", "oslash": "ø", "osol": "⊘", "Otilde": "Õ", "otilde": "õ", "otimesas": "⨶", "Otimes": "⨷", "otimes": "⊗", "Ouml": "Ö", "ouml": "ö", "ovbar": "⌽", "OverBar": "‾", "OverBrace": "⏞", "OverBracket": "⎴", "OverParenthesis": "⏜", "para": "¶", "parallel": "∥", "par": "∥", "parsim": "⫳", "parsl": "⫽", "part": "∂", "PartialD": "∂", "Pcy": "П", "pcy": "п", "percnt": "%", "period": ".", "permil": "‰", "perp": "⊥", "pertenk": "‱", "Pfr": "𝔓", "pfr": "𝔭", "Phi": "Φ", "phi": "φ", "phiv": "ϕ", "phmmat": "ℳ", "phone": "☎", "Pi": "Π", "pi": "π", "pitchfork": "⋔", "piv": "ϖ", "planck": "ℏ", "planckh": "ℎ", "plankv": "ℏ", "plusacir": "⨣", "plusb": "⊞", "pluscir": "⨢", "plus": "+", "plusdo": "∔", "plusdu": "⨥", "pluse": "⩲", "PlusMinus": "±", "plusmn": "±", "plussim": "⨦", "plustwo": "⨧", "pm": "±", "Poincareplane": "ℌ", "pointint": "⨕", "popf": "𝕡", "Popf": "ℙ", "pound": "£", "prap": "⪷", "Pr": "⪻", "pr": "≺", "prcue": "≼", "precapprox": "⪷", "prec": "≺", "preccurlyeq": "≼", "Precedes": "≺", "PrecedesEqual": "⪯", "PrecedesSlantEqual": "≼", "PrecedesTilde": "≾", "preceq": "⪯", "precnapprox": "⪹", "precneqq": "⪵", "precnsim": "⋨", "pre": "⪯", "prE": "⪳", "precsim": "≾", "prime": "′", "Prime": "″", "primes": "ℙ", "prnap": "⪹", "prnE": "⪵", "prnsim": "⋨", "prod": "∏", "Product": "∏", "profalar": "⌮", "profline": "⌒", "profsurf": "⌓", "prop": "∝", "Proportional": "∝", "Proportion": "∷", "propto": "∝", "prsim": "≾", "prurel": "⊰", "Pscr": "𝒫", "pscr": "𝓅", "Psi": "Ψ", "psi": "ψ", "puncsp": " ", "Qfr": "𝔔", "qfr": "𝔮", "qint": "⨌", "qopf": "𝕢", "Qopf": "ℚ", "qprime": "⁗", "Qscr": "𝒬", "qscr": "𝓆", "quaternions": "ℍ", "quatint": "⨖", "quest": "?", "questeq": "≟", "quot": "\"", "QUOT": "\"", "rAarr": "⇛", "race": "∽̱", "Racute": "Ŕ", "racute": "ŕ", "radic": "√", "raemptyv": "⦳", "rang": "⟩", "Rang": "⟫", "rangd": "⦒", "range": "⦥", "rangle": "⟩", "raquo": "»", "rarrap": "⥵", "rarrb": "⇥", "rarrbfs": "⤠", "rarrc": "⤳", "rarr": "→", "Rarr": "↠", "rArr": "⇒", "rarrfs": "⤞", "rarrhk": "↪", "rarrlp": "↬", "rarrpl": "⥅", "rarrsim": "⥴", "Rarrtl": "⤖", "rarrtl": "↣", "rarrw": "↝", "ratail": "⤚", "rAtail": "⤜", "ratio": "∶", "rationals": "ℚ", "rbarr": "⤍", "rBarr": "⤏", "RBarr": "⤐", "rbbrk": "❳", "rbrace": "}", "rbrack": "]", "rbrke": "⦌", "rbrksld": "⦎", "rbrkslu": "⦐", "Rcaron": "Ř", "rcaron": "ř", "Rcedil": "Ŗ", "rcedil": "ŗ", "rceil": "⌉", "rcub": "}", "Rcy": "Р", "rcy": "р", "rdca": "⤷", "rdldhar": "⥩", "rdquo": "”", "rdquor": "”", "rdsh": "↳", "real": "ℜ", "realine": "ℛ", "realpart": "ℜ", "reals": "ℝ", "Re": "ℜ", "rect": "▭", "reg": "®", "REG": "®", "ReverseElement": "∋", "ReverseEquilibrium": "⇋", "ReverseUpEquilibrium": "⥯", "rfisht": "⥽", "rfloor": "⌋", "rfr": "𝔯", "Rfr": "ℜ", "rHar": "⥤", "rhard": "⇁", "rharu": "⇀", "rharul": "⥬", "Rho": "Ρ", "rho": "ρ", "rhov": "ϱ", "RightAngleBracket": "⟩", "RightArrowBar": "⇥", "rightarrow": "→", "RightArrow": "→", "Rightarrow": "⇒", "RightArrowLeftArrow": "⇄", "rightarrowtail": "↣", "RightCeiling": "⌉", "RightDoubleBracket": "⟧", "RightDownTeeVector": "⥝", "RightDownVectorBar": "⥕", "RightDownVector": "⇂", "RightFloor": "⌋", "rightharpoondown": "⇁", "rightharpoonup": "⇀", "rightleftarrows": "⇄", "rightleftharpoons": "⇌", "rightrightarrows": "⇉", "rightsquigarrow": "↝", "RightTeeArrow": "↦", "RightTee": "⊢", "RightTeeVector": "⥛", "rightthreetimes": "⋌", "RightTriangleBar": "⧐", "RightTriangle": "⊳", "RightTriangleEqual": "⊵", "RightUpDownVector": "⥏", "RightUpTeeVector": "⥜", "RightUpVectorBar": "⥔", "RightUpVector": "↾", "RightVectorBar": "⥓", "RightVector": "⇀", "ring": "˚", "risingdotseq": "≓", "rlarr": "⇄", "rlhar": "⇌", "rlm": "‏", "rmoustache": "⎱", "rmoust": "⎱", "rnmid": "⫮", "roang": "⟭", "roarr": "⇾", "robrk": "⟧", "ropar": "⦆", "ropf": "𝕣", "Ropf": "ℝ", "roplus": "⨮", "rotimes": "⨵", "RoundImplies": "⥰", "rpar": ")", "rpargt": "⦔", "rppolint": "⨒", "rrarr": "⇉", "Rrightarrow": "⇛", "rsaquo": "›", "rscr": "𝓇", "Rscr": "ℛ", "rsh": "↱", "Rsh": "↱", "rsqb": "]", "rsquo": "’", "rsquor": "’", "rthree": "⋌", "rtimes": "⋊", "rtri": "▹", "rtrie": "⊵", "rtrif": "▸", "rtriltri": "⧎", "RuleDelayed": "⧴", "ruluhar": "⥨", "rx": "℞", "Sacute": "Ś", "sacute": "ś", "sbquo": "‚", "scap": "⪸", "Scaron": "Š", "scaron": "š", "Sc": "⪼", "sc": "≻", "sccue": "≽", "sce": "⪰", "scE": "⪴", "Scedil": "Ş", "scedil": "ş", "Scirc": "Ŝ", "scirc": "ŝ", "scnap": "⪺", "scnE": "⪶", "scnsim": "⋩", "scpolint": "⨓", "scsim": "≿", "Scy": "С", "scy": "с", "sdotb": "⊡", "sdot": "⋅", "sdote": "⩦", "searhk": "⤥", "searr": "↘", "seArr": "⇘", "searrow": "↘", "sect": "§", "semi": ";", "seswar": "⤩", "setminus": "∖", "setmn": "∖", "sext": "✶", "Sfr": "𝔖", "sfr": "𝔰", "sfrown": "⌢", "sharp": "♯", "SHCHcy": "Щ", "shchcy": "щ", "SHcy": "Ш", "shcy": "ш", "ShortDownArrow": "↓", "ShortLeftArrow": "←", "shortmid": "∣", "shortparallel": "∥", "ShortRightArrow": "→", "ShortUpArrow": "↑", "shy": "­", "Sigma": "Σ", "sigma": "σ", "sigmaf": "ς", "sigmav": "ς", "sim": "∼", "simdot": "⩪", "sime": "≃", "simeq": "≃", "simg": "⪞", "simgE": "⪠", "siml": "⪝", "simlE": "⪟", "simne": "≆", "simplus": "⨤", "simrarr": "⥲", "slarr": "←", "SmallCircle": "∘", "smallsetminus": "∖", "smashp": "⨳", "smeparsl": "⧤", "smid": "∣", "smile": "⌣", "smt": "⪪", "smte": "⪬", "smtes": "⪬︀", "SOFTcy": "Ь", "softcy": "ь", "solbar": "⌿", "solb": "⧄", "sol": "/", "Sopf": "𝕊", "sopf": "𝕤", "spades": "♠", "spadesuit": "♠", "spar": "∥", "sqcap": "⊓", "sqcaps": "⊓︀", "sqcup": "⊔", "sqcups": "⊔︀", "Sqrt": "√", "sqsub": "⊏", "sqsube": "⊑", "sqsubset": "⊏", "sqsubseteq": "⊑", "sqsup": "⊐", "sqsupe": "⊒", "sqsupset": "⊐", "sqsupseteq": "⊒", "square": "□", "Square": "□", "SquareIntersection": "⊓", "SquareSubset": "⊏", "SquareSubsetEqual": "⊑", "SquareSuperset": "⊐", "SquareSupersetEqual": "⊒", "SquareUnion": "⊔", "squarf": "▪", "squ": "□", "squf": "▪", "srarr": "→", "Sscr": "𝒮", "sscr": "𝓈", "ssetmn": "∖", "ssmile": "⌣", "sstarf": "⋆", "Star": "⋆", "star": "☆", "starf": "★", "straightepsilon": "ϵ", "straightphi": "ϕ", "strns": "¯", "sub": "⊂", "Sub": "⋐", "subdot": "⪽", "subE": "⫅", "sube": "⊆", "subedot": "⫃", "submult": "⫁", "subnE": "⫋", "subne": "⊊", "subplus": "⪿", "subrarr": "⥹", "subset": "⊂", "Subset": "⋐", "subseteq": "⊆", "subseteqq": "⫅", "SubsetEqual": "⊆", "subsetneq": "⊊", "subsetneqq": "⫋", "subsim": "⫇", "subsub": "⫕", "subsup": "⫓", "succapprox": "⪸", "succ": "≻", "succcurlyeq": "≽", "Succeeds": "≻", "SucceedsEqual": "⪰", "SucceedsSlantEqual": "≽", "SucceedsTilde": "≿", "succeq": "⪰", "succnapprox": "⪺", "succneqq": "⪶", "succnsim": "⋩", "succsim": "≿", "SuchThat": "∋", "sum": "∑", "Sum": "∑", "sung": "♪", "sup1": "¹", "sup2": "²", "sup3": "³", "sup": "⊃", "Sup": "⋑", "supdot": "⪾", "supdsub": "⫘", "supE": "⫆", "supe": "⊇", "supedot": "⫄", "Superset": "⊃", "SupersetEqual": "⊇", "suphsol": "⟉", "suphsub": "⫗", "suplarr": "⥻", "supmult": "⫂", "supnE": "⫌", "supne": "⊋", "supplus": "⫀", "supset": "⊃", "Supset": "⋑", "supseteq": "⊇", "supseteqq": "⫆", "supsetneq": "⊋", "supsetneqq": "⫌", "supsim": "⫈", "supsub": "⫔", "supsup": "⫖", "swarhk": "⤦", "swarr": "↙", "swArr": "⇙", "swarrow": "↙", "swnwar": "⤪", "szlig": "ß", "Tab": "\t", "target": "⌖", "Tau": "Τ", "tau": "τ", "tbrk": "⎴", "Tcaron": "Ť", "tcaron": "ť", "Tcedil": "Ţ", "tcedil": "ţ", "Tcy": "Т", "tcy": "т", "tdot": "⃛", "telrec": "⌕", "Tfr": "𝔗", "tfr": "𝔱", "there4": "∴", "therefore": "∴", "Therefore": "∴", "Theta": "Θ", "theta": "θ", "thetasym": "ϑ", "thetav": "ϑ", "thickapprox": "≈", "thicksim": "∼", "ThickSpace": "  ", "ThinSpace": " ", "thinsp": " ", "thkap": "≈", "thksim": "∼", "THORN": "Þ", "thorn": "þ", "tilde": "˜", "Tilde": "∼", "TildeEqual": "≃", "TildeFullEqual": "≅", "TildeTilde": "≈", "timesbar": "⨱", "timesb": "⊠", "times": "×", "timesd": "⨰", "tint": "∭", "toea": "⤨", "topbot": "⌶", "topcir": "⫱", "top": "⊤", "Topf": "𝕋", "topf": "𝕥", "topfork": "⫚", "tosa": "⤩", "tprime": "‴", "trade": "™", "TRADE": "™", "triangle": "▵", "triangledown": "▿", "triangleleft": "◃", "trianglelefteq": "⊴", "triangleq": "≜", "triangleright": "▹", "trianglerighteq": "⊵", "tridot": "◬", "trie": "≜", "triminus": "⨺", "TripleDot": "⃛", "triplus": "⨹", "trisb": "⧍", "tritime": "⨻", "trpezium": "⏢", "Tscr": "𝒯", "tscr": "𝓉", "TScy": "Ц", "tscy": "ц", "TSHcy": "Ћ", "tshcy": "ћ", "Tstrok": "Ŧ", "tstrok": "ŧ", "twixt": "≬", "twoheadleftarrow": "↞", "twoheadrightarrow": "↠", "Uacute": "Ú", "uacute": "ú", "uarr": "↑", "Uarr": "↟", "uArr": "⇑", "Uarrocir": "⥉", "Ubrcy": "Ў", "ubrcy": "ў", "Ubreve": "Ŭ", "ubreve": "ŭ", "Ucirc": "Û", "ucirc": "û", "Ucy": "У", "ucy": "у", "udarr": "⇅", "Udblac": "Ű", "udblac": "ű", "udhar": "⥮", "ufisht": "⥾", "Ufr": "𝔘", "ufr": "𝔲", "Ugrave": "Ù", "ugrave": "ù", "uHar": "⥣", "uharl": "↿", "uharr": "↾", "uhblk": "▀", "ulcorn": "⌜", "ulcorner": "⌜", "ulcrop": "⌏", "ultri": "◸", "Umacr": "Ū", "umacr": "ū", "uml": "¨", "UnderBar": "_", "UnderBrace": "⏟", "UnderBracket": "⎵", "UnderParenthesis": "⏝", "Union": "⋃", "UnionPlus": "⊎", "Uogon": "Ų", "uogon": "ų", "Uopf": "𝕌", "uopf": "𝕦", "UpArrowBar": "⤒", "uparrow": "↑", "UpArrow": "↑", "Uparrow": "⇑", "UpArrowDownArrow": "⇅", "updownarrow": "↕", "UpDownArrow": "↕", "Updownarrow": "⇕", "UpEquilibrium": "⥮", "upharpoonleft": "↿", "upharpoonright": "↾", "uplus": "⊎", "UpperLeftArrow": "↖", "UpperRightArrow": "↗", "upsi": "υ", "Upsi": "ϒ", "upsih": "ϒ", "Upsilon": "Υ", "upsilon": "υ", "UpTeeArrow": "↥", "UpTee": "⊥", "upuparrows": "⇈", "urcorn": "⌝", "urcorner": "⌝", "urcrop": "⌎", "Uring": "Ů", "uring": "ů", "urtri": "◹", "Uscr": "𝒰", "uscr": "𝓊", "utdot": "⋰", "Utilde": "Ũ", "utilde": "ũ", "utri": "▵", "utrif": "▴", "uuarr": "⇈", "Uuml": "Ü", "uuml": "ü", "uwangle": "⦧", "vangrt": "⦜", "varepsilon": "ϵ", "varkappa": "ϰ", "varnothing": "∅", "varphi": "ϕ", "varpi": "ϖ", "varpropto": "∝", "varr": "↕", "vArr": "⇕", "varrho": "ϱ", "varsigma": "ς", "varsubsetneq": "⊊︀", "varsubsetneqq": "⫋︀", "varsupsetneq": "⊋︀", "varsupsetneqq": "⫌︀", "vartheta": "ϑ", "vartriangleleft": "⊲", "vartriangleright": "⊳", "vBar": "⫨", "Vbar": "⫫", "vBarv": "⫩", "Vcy": "В", "vcy": "в", "vdash": "⊢", "vDash": "⊨", "Vdash": "⊩", "VDash": "⊫", "Vdashl": "⫦", "veebar": "⊻", "vee": "∨", "Vee": "⋁", "veeeq": "≚", "vellip": "⋮", "verbar": "|", "Verbar": "‖", "vert": "|", "Vert": "‖", "VerticalBar": "∣", "VerticalLine": "|", "VerticalSeparator": "❘", "VerticalTilde": "≀", "VeryThinSpace": " ", "Vfr": "𝔙", "vfr": "𝔳", "vltri": "⊲", "vnsub": "⊂⃒", "vnsup": "⊃⃒", "Vopf": "𝕍", "vopf": "𝕧", "vprop": "∝", "vrtri": "⊳", "Vscr": "𝒱", "vscr": "𝓋", "vsubnE": "⫋︀", "vsubne": "⊊︀", "vsupnE": "⫌︀", "vsupne": "⊋︀", "Vvdash": "⊪", "vzigzag": "⦚", "Wcirc": "Ŵ", "wcirc": "ŵ", "wedbar": "⩟", "wedge": "∧", "Wedge": "⋀", "wedgeq": "≙", "weierp": "℘", "Wfr": "𝔚", "wfr": "𝔴", "Wopf": "𝕎", "wopf": "𝕨", "wp": "℘", "wr": "≀", "wreath": "≀", "Wscr": "𝒲", "wscr": "𝓌", "xcap": "⋂", "xcirc": "◯", "xcup": "⋃", "xdtri": "▽", "Xfr": "𝔛", "xfr": "𝔵", "xharr": "⟷", "xhArr": "⟺", "Xi": "Ξ", "xi": "ξ", "xlarr": "⟵", "xlArr": "⟸", "xmap": "⟼", "xnis": "⋻", "xodot": "⨀", "Xopf": "𝕏", "xopf": "𝕩", "xoplus": "⨁", "xotime": "⨂", "xrarr": "⟶", "xrArr": "⟹", "Xscr": "𝒳", "xscr": "𝓍", "xsqcup": "⨆", "xuplus": "⨄", "xutri": "△", "xvee": "⋁", "xwedge": "⋀", "Yacute": "Ý", "yacute": "ý", "YAcy": "Я", "yacy": "я", "Ycirc": "Ŷ", "ycirc": "ŷ", "Ycy": "Ы", "ycy": "ы", "yen": "¥", "Yfr": "𝔜", "yfr": "𝔶", "YIcy": "Ї", "yicy": "ї", "Yopf": "𝕐", "yopf": "𝕪", "Yscr": "𝒴", "yscr": "𝓎", "YUcy": "Ю", "yucy": "ю", "yuml": "ÿ", "Yuml": "Ÿ", "Zacute": "Ź", "zacute": "ź", "Zcaron": "Ž", "zcaron": "ž", "Zcy": "З", "zcy": "з", "Zdot": "Ż", "zdot": "ż", "zeetrf": "ℨ", "ZeroWidthSpace": "​", "Zeta": "Ζ", "zeta": "ζ", "zfr": "𝔷", "Zfr": "ℨ", "ZHcy": "Ж", "zhcy": "ж", "zigrarr": "⇝", "zopf": "𝕫", "Zopf": "ℤ", "Zscr": "𝒵", "zscr": "𝓏", "zwj": "‍", "zwnj": "‌" };
  }, {}], 7: [function (require, module, exports) {
    module.exports = { "Aacute": "Á", "aacute": "á", "Acirc": "Â", "acirc": "â", "acute": "´", "AElig": "Æ", "aelig": "æ", "Agrave": "À", "agrave": "à", "amp": "&", "AMP": "&", "Aring": "Å", "aring": "å", "Atilde": "Ã", "atilde": "ã", "Auml": "Ä", "auml": "ä", "brvbar": "¦", "Ccedil": "Ç", "ccedil": "ç", "cedil": "¸", "cent": "¢", "copy": "©", "COPY": "©", "curren": "¤", "deg": "°", "divide": "÷", "Eacute": "É", "eacute": "é", "Ecirc": "Ê", "ecirc": "ê", "Egrave": "È", "egrave": "è", "ETH": "Ð", "eth": "ð", "Euml": "Ë", "euml": "ë", "frac12": "½", "frac14": "¼", "frac34": "¾", "gt": ">", "GT": ">", "Iacute": "Í", "iacute": "í", "Icirc": "Î", "icirc": "î", "iexcl": "¡", "Igrave": "Ì", "igrave": "ì", "iquest": "¿", "Iuml": "Ï", "iuml": "ï", "laquo": "«", "lt": "<", "LT": "<", "macr": "¯", "micro": "µ", "middot": "·", "nbsp": " ", "not": "¬", "Ntilde": "Ñ", "ntilde": "ñ", "Oacute": "Ó", "oacute": "ó", "Ocirc": "Ô", "ocirc": "ô", "Ograve": "Ò", "ograve": "ò", "ordf": "ª", "ordm": "º", "Oslash": "Ø", "oslash": "ø", "Otilde": "Õ", "otilde": "õ", "Ouml": "Ö", "ouml": "ö", "para": "¶", "plusmn": "±", "pound": "£", "quot": "\"", "QUOT": "\"", "raquo": "»", "reg": "®", "REG": "®", "sect": "§", "shy": "­", "sup1": "¹", "sup2": "²", "sup3": "³", "szlig": "ß", "THORN": "Þ", "thorn": "þ", "times": "×", "Uacute": "Ú", "uacute": "ú", "Ucirc": "Û", "ucirc": "û", "Ugrave": "Ù", "ugrave": "ù", "uml": "¨", "Uuml": "Ü", "uuml": "ü", "Yacute": "Ý", "yacute": "ý", "yen": "¥", "yuml": "ÿ" };
  }, {}], 8: [function (require, module, exports) {
    module.exports = { "amp": "&", "apos": "'", "gt": ">", "lt": "<", "quot": "\"" };
  }, {}], "ansi-to-html": [function (require, module, exports) {
    'use strict';
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps)
        _defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        _defineProperties(Constructor, staticProps);
      return Constructor;
    }
    function _createForOfIteratorHelper(o, allowArrayLike) {
      var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
      if (!it) {
        if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
          if (it)
            o = it;
          var i = 0;
          var F = function F() { };
          return {
            s: F, n: function n() {
              if (i >= o.length)
                return { done: true };
              return { done: false, value: o[i++] };
            }, e: function e(_e) { throw _e; }, f: F
          };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      var normalCompletion = true, didErr = false, err;
      return {
        s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() {
          try {
            if (!normalCompletion && it["return"] != null)
              it["return"]();
          }
          finally {
            if (didErr)
              throw err;
          }
        }
      };
    }
    function _unsupportedIterableToArray(o, minLen) {
      if (!o)
        return;
      if (typeof o === "string")
        return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor)
        n = o.constructor.name;
      if (n === "Map" || n === "Set")
        return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
        return _arrayLikeToArray(o, minLen);
    }
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length)
        len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    }
    var entities = require('entities');
    var defaults = {
      fg: '#FFF',
      bg: '#000',
      newline: false,
      escapeXML: false,
      stream: false,
      colors: getDefaultColors()
    };
    function getDefaultColors() {
      var colors = {
        0: '#000',
        1: '#A00',
        2: '#0A0',
        3: '#A50',
        4: '#00A',
        5: '#A0A',
        6: '#0AA',
        7: '#AAA',
        8: '#555',
        9: '#F55',
        10: '#5F5',
        11: '#FF5',
        12: '#55F',
        13: '#F5F',
        14: '#5FF',
        15: '#FFF'
      };
      range(0, 5).forEach(function (red) {
        range(0, 5).forEach(function (green) {
          range(0, 5).forEach(function (blue) {
            return setStyleColor(red, green, blue, colors);
          });
        });
      });
      range(0, 23).forEach(function (gray) {
        var c = gray + 232;
        var l = toHexString(gray * 10 + 8);
        colors[c] = '#' + l + l + l;
      });
      return colors;
    }
    function setStyleColor(red, green, blue, colors) {
      var c = 16 + red * 36 + green * 6 + blue;
      var r = red > 0 ? red * 40 + 55 : 0;
      var g = green > 0 ? green * 40 + 55 : 0;
      var b = blue > 0 ? blue * 40 + 55 : 0;
      colors[c] = toColorHexString([r, g, b]);
    }
    function toHexString(num) {
      var str = num.toString(16);
      while (str.length < 2) {
        str = '0' + str;
      }
      return str;
    }
    function toColorHexString(ref) {
      var results = [];
      var _iterator = _createForOfIteratorHelper(ref), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var r = _step.value;
          results.push(toHexString(r));
        }
      }
      catch (err) {
        _iterator.e(err);
      }
      finally {
        _iterator.f();
      }
      return '#' + results.join('');
    }
    function generateOutput(stack, token, data, options) {
      var result;
      if (token === 'text') {
        result = pushText(data, options);
      }
      else if (token === 'display') {
        result = handleDisplay(stack, data, options);
      }
      else if (token === 'xterm256Foreground') {
        result = pushForegroundColor(stack, options.colors[data]);
      }
      else if (token === 'xterm256Background') {
        result = pushBackgroundColor(stack, options.colors[data]);
      }
      else if (token === 'rgb') {
        result = handleRgb(stack, data);
      }
      return result;
    }
    function handleRgb(stack, data) {
      data = data.substring(2).slice(0, -1);
      var operation = +data.substr(0, 2);
      var color = data.substring(5).split(';');
      var rgb = color.map(function (value) {
        return ('0' + Number(value).toString(16)).substr(-2);
      }).join('');
      return pushStyle(stack, (operation === 38 ? 'color:#' : 'background-color:#') + rgb);
    }
    function handleDisplay(stack, code, options) {
      code = parseInt(code, 10);
      var codeMap = {
        '-1': function _() {
          return '<br/>';
        },
        0: function _() {
          return stack.length && resetStyles(stack);
        },
        1: function _() {
          return pushTag(stack, 'b');
        },
        3: function _() {
          return pushTag(stack, 'i');
        },
        4: function _() {
          return pushTag(stack, 'u');
        },
        8: function _() {
          return pushStyle(stack, 'display:none');
        },
        9: function _() {
          return pushTag(stack, 'strike');
        },
        22: function _() {
          return pushStyle(stack, 'font-weight:normal;text-decoration:none;font-style:normal');
        },
        23: function _() {
          return closeTag(stack, 'i');
        },
        24: function _() {
          return closeTag(stack, 'u');
        },
        39: function _() {
          return pushForegroundColor(stack, options.fg);
        },
        49: function _() {
          return pushBackgroundColor(stack, options.bg);
        },
        53: function _() {
          return pushStyle(stack, 'text-decoration:overline');
        }
      };
      var result;
      if (codeMap[code]) {
        result = codeMap[code]();
      }
      else if (4 < code && code < 7) {
        result = pushTag(stack, 'blink');
      }
      else if (29 < code && code < 38) {
        result = pushForegroundColor(stack, options.colors[code - 30]);
      }
      else if (39 < code && code < 48) {
        result = pushBackgroundColor(stack, options.colors[code - 40]);
      }
      else if (89 < code && code < 98) {
        result = pushForegroundColor(stack, options.colors[8 + (code - 90)]);
      }
      else if (99 < code && code < 108) {
        result = pushBackgroundColor(stack, options.colors[8 + (code - 100)]);
      }
      return result;
    }
    function resetStyles(stack) {
      var stackClone = stack.slice(0);
      stack.length = 0;
      return stackClone.reverse().map(function (tag) {
        return '</' + tag + '>';
      }).join('');
    }
    function range(low, high) {
      var results = [];
      for (var j = low; j <= high; j++) {
        results.push(j);
      }
      return results;
    }
    function notCategory(category) {
      return function (e) {
        return (category === null || e.category !== category) && category !== 'all';
      };
    }
    function categoryForCode(code) {
      code = parseInt(code, 10);
      var result = null;
      if (code === 0) {
        result = 'all';
      }
      else if (code === 1) {
        result = 'bold';
      }
      else if (2 < code && code < 5) {
        result = 'underline';
      }
      else if (4 < code && code < 7) {
        result = 'blink';
      }
      else if (code === 8) {
        result = 'hide';
      }
      else if (code === 9) {
        result = 'strike';
      }
      else if (29 < code && code < 38 || code === 39 || 89 < code && code < 98) {
        result = 'foreground-color';
      }
      else if (39 < code && code < 48 || code === 49 || 99 < code && code < 108) {
        result = 'background-color';
      }
      return result;
    }
    function pushText(text, options) {
      if (options.escapeXML) {
        return entities.encodeXML(text);
      }
      return text;
    }
    function pushTag(stack, tag, style) {
      if (!style) {
        style = '';
      }
      stack.push(tag);
      return "<".concat(tag).concat(style ? " style=\"".concat(style, "\"") : '', ">");
    }
    function pushStyle(stack, style) {
      return pushTag(stack, 'span', style);
    }
    function pushForegroundColor(stack, color) {
      return pushTag(stack, 'span', 'color:' + color);
    }
    function pushBackgroundColor(stack, color) {
      return pushTag(stack, 'span', 'background-color:' + color);
    }
    function closeTag(stack, style) {
      var last;
      if (stack.slice(-1)[0] === style) {
        last = stack.pop();
      }
      if (last) {
        return '</' + style + '>';
      }
    }
    function tokenize(text, options, callback) {
      var ansiMatch = false;
      var ansiHandler = 3;
      function remove() {
        return '';
      }
      function removeXterm256Foreground(m, g1) {
        callback('xterm256Foreground', g1);
        return '';
      }
      function removeXterm256Background(m, g1) {
        callback('xterm256Background', g1);
        return '';
      }
      function newline(m) {
        if (options.newline) {
          callback('display', -1);
        }
        else {
          callback('text', m);
        }
        return '';
      }
      function ansiMess(m, g1) {
        ansiMatch = true;
        if (g1.trim().length === 0) {
          g1 = '0';
        }
        g1 = g1.trimRight(';').split(';');
        var _iterator2 = _createForOfIteratorHelper(g1), _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var g = _step2.value;
            callback('display', g);
          }
        }
        catch (err) {
          _iterator2.e(err);
        }
        finally {
          _iterator2.f();
        }
        return '';
      }
      function realText(m) {
        callback('text', m);
        return '';
      }
      function rgb(m) {
        callback('rgb', m);
        return '';
      }
      var tokens = [{
        pattern: /^\x08+/,
        sub: remove
      }, {
        pattern: /^\x1b\[[012]?K/,
        sub: remove
      }, {
        pattern: /^\x1b\[\(B/,
        sub: remove
      }, {
        pattern: /^\x1b\[[34]8;2;\d+;\d+;\d+m/,
        sub: rgb
      }, {
        pattern: /^\x1b\[38;5;(\d+)m/,
        sub: removeXterm256Foreground
      }, {
        pattern: /^\x1b\[48;5;(\d+)m/,
        sub: removeXterm256Background
      }, {
        pattern: /^\n/,
        sub: newline
      }, {
        pattern: /^\r+\n/,
        sub: newline
      }, {
        pattern: /^\r/,
        sub: newline
      }, {
        pattern: /^\x1b\[((?:\d{1,3};?)+|)m/,
        sub: ansiMess
      }, {
        pattern: /^\x1b\[\d?J/,
        sub: remove
      }, {
        pattern: /^\x1b\[\d{0,3};\d{0,3}f/,
        sub: remove
      }, {
        pattern: /^\x1b\[?[\d;]{0,3}/,
        sub: remove
      }, {
        pattern: /^(([^\x1b\x08\r\n])+)/,
        sub: realText
      }];
      function process(handler, i) {
        if (i > ansiHandler && ansiMatch) {
          return;
        }
        ansiMatch = false;
        text = text.replace(handler.pattern, handler.sub);
      }
      var results1 = [];
      var _text = text, length = _text.length;
      outer: while (length > 0) {
        for (var i = 0, o = 0, len = tokens.length; o < len; i = ++o) {
          var handler = tokens[i];
          process(handler, i);
          if (text.length !== length) {
            length = text.length;
            continue outer;
          }
        }
        if (text.length === length) {
          break;
        }
        results1.push(0);
        length = text.length;
      }
      return results1;
    }
    function updateStickyStack(stickyStack, token, data) {
      if (token !== 'text') {
        stickyStack = stickyStack.filter(notCategory(categoryForCode(data)));
        stickyStack.push({
          token: token,
          data: data,
          category: categoryForCode(data)
        });
      }
      return stickyStack;
    }
    var Filter = function () {
      function Filter(options) {
        _classCallCheck(this, Filter);
        options = options || {};
        if (options.colors) {
          options.colors = Object.assign({}, defaults.colors, options.colors);
        }
        this.options = Object.assign({}, defaults, options);
        this.stack = [];
        this.stickyStack = [];
      }
      _createClass(Filter, [{
        key: "toHtml",
        value: function toHtml(input) {
          var _this = this;
          input = typeof input === 'string' ? [input] : input;
          var stack = this.stack, options = this.options;
          var buf = [];
          this.stickyStack.forEach(function (element) {
            var output = generateOutput(stack, element.token, element.data, options);
            if (output) {
              buf.push(output);
            }
          });
          tokenize(input.join(''), options, function (token, data) {
            var output = generateOutput(stack, token, data, options);
            if (output) {
              buf.push(output);
            }
            if (options.stream) {
              _this.stickyStack = updateStickyStack(_this.stickyStack, token, data);
            }
          });
          if (stack.length) {
            buf.push(resetStyles(stack));
          }
          return buf.join('');
        }
      }]);
      return Filter;
    }();
    module.exports = Filter;
  }, { "entities": 4 }]
}, {}, []);

/**
 * Notice:
 * Converted to a web module by browserify. This code is external to
 * the rest of the project it is housed within and is thus only subject
 * to the licence housed within the header. Apart from this comment and
 * the ammendment of the required licence text. This document has not
 * been modified. Please support the original creators of this here code
 * if at all possible. As it is critical to the continued operation of
 * the rest of this here project.
 *
 * The below code is just a converter to make it work with ES6 properly.
 * It is the only original code in the whole document. 
 */
/**@type {(opts:ConverterOptions)=>{toHtml:(data: string)=> string;}} */
const mod = (opts) => new (require("ansi-to-html"))(opts);
export default mod;
