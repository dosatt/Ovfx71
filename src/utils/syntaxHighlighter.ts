export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'css' | 'html' | 'json' | 'sql' | 'swift' | 'c' | 'cpp' | 'csharp' | 'text';

export const supportedLanguages: { value: SupportedLanguage; label: string }[] = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'swift', label: 'Swift' },
    { value: 'c', label: 'C' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'css', label: 'CSS' },
    { value: 'html', label: 'HTML' },
    { value: 'json', label: 'JSON' },
    { value: 'sql', label: 'SQL' },
    { value: 'text', label: 'Plain Text' },
];

interface Token {
    start: number;
    end: number;
    className: string;
    text: string;
}

export function highlightCode(code: string, language: SupportedLanguage): string {
    if (!code) return '';
    if (language === 'text') return escapeHtml(code);

    const rules: Record<string, { regex: RegExp; className: string }[]> = {
        javascript: [
            { regex: /\/\/.*/g, className: 'syntax-comment' },
            { regex: /\/\*[\s\S]*?\*\//g, className: 'syntax-comment' },
            { regex: /"(?:\\.|[^"\\])*"/g, className: 'syntax-string' },
            { regex: /'(?:\\.|[^'\\])*'/g, className: 'syntax-string' },
            { regex: /`(?:\\.|[^`\\])*`/g, className: 'syntax-string' },
            { regex: /\b(break|case|catch|continue|debugger|default|do|else|finally|for|if|return|switch|throw|try|while|with|yield|await|async)\b/g, className: 'syntax-control' },
            { regex: /\b(class|const|delete|enum|export|extends|false|function|import|in|instanceof|new|null|super|this|typeof|var|void|as|implements|interface|let|package|private|protected|public|static|any|boolean|constructor|declare|get|module|require|set|type|from|of)\b/g, className: 'syntax-keyword' },
            { regex: /\b(window|document|console|Math|JSON|Object|Array|String|Number|Boolean|Function|Promise|Error)\b/g, className: 'syntax-builtin' },
            { regex: /\b\d+(\.\d+)?\b/g, className: 'syntax-number' },
            { regex: /\b[a-z_][a-z0-9_]*(?=\s*\()/gi, className: 'syntax-function' },
            { regex: /\b[A-Z][a-zA-Z0-9_]*\b/g, className: 'syntax-class' },
            { regex: /[a-z_][a-z0-9_]*(?=\s*:)/gi, className: 'syntax-property' },
            { regex: /[{}()[\].,:;]/g, className: 'syntax-operator' },
        ],
        typescript: [
            { regex: /\/\/.*/g, className: 'syntax-comment' },
            { regex: /\/\*[\s\S]*?\*\//g, className: 'syntax-comment' },
            { regex: /"(?:\\.|[^"\\])*"/g, className: 'syntax-string' },
            { regex: /'(?:\\.|[^'\\])*'/g, className: 'syntax-string' },
            { regex: /`(?:\\.|[^`\\])*`/g, className: 'syntax-string' },
            { regex: /\b(break|case|catch|continue|debugger|default|do|else|finally|for|if|return|switch|throw|try|while|with|yield|await|async)\b/g, className: 'syntax-control' },
            { regex: /\b(class|const|delete|enum|export|extends|false|function|import|in|instanceof|new|null|super|this|typeof|var|void|as|implements|interface|let|package|private|protected|public|static|any|boolean|constructor|declare|get|module|require|set|type|from|of|enum|namespace|readonly|unknown|never|keyof|infer)\b/g, className: 'syntax-keyword' },
            { regex: /\b(string|number|boolean|any|void|never|unknown|object|Array|Promise|Map|Set)\b/g, className: 'syntax-builtin' },
            { regex: /\b\d+(\.\d+)?\b/g, className: 'syntax-number' },
            { regex: /\b[a-z_][a-z0-9_]*(?=\s*\()/gi, className: 'syntax-function' },
            { regex: /\b[A-Z][a-zA-Z0-9_]*\b/g, className: 'syntax-class' },
            { regex: /[a-z_][a-z0-9_]*(?=\s*:)/gi, className: 'syntax-property' },
            { regex: /[{}()[\].,:;]/g, className: 'syntax-operator' },
        ],
        python: [
            { regex: /#.*/g, className: 'syntax-comment' },
            { regex: /"""[\s\S]*?"""/g, className: 'syntax-comment' },
            { regex: /'''[\s\S]*?'''/g, className: 'syntax-comment' },
            { regex: /r?"(?:\\.|[^"\\])*"/g, className: 'syntax-string' },
            { regex: /r?'(?:\\.|[^'\\])*'/g, className: 'syntax-string' },
            { regex: /\b(break|continue|elif|else|except|finally|for|if|return|try|while|with|yield|async|await)\b/g, className: 'syntax-control' },
            { regex: /\b(and|as|assert|class|def|del|False|from|global|import|in|is|lambda|None|nonlocal|not|or|pass|raise|True)\b/g, className: 'syntax-keyword' },
            { regex: /\b(print|len|range|enumerate|zip|dict|list|set|tuple|int|str|float|type|id|hex|bin)\b/g, className: 'syntax-builtin' },
            { regex: /\b\d+(\.\d+)?\b/g, className: 'syntax-number' },
            { regex: /\b[a-z_][a-z0-9_]*(?=\s*\()/gi, className: 'syntax-function' },
            { regex: /[{}()[\].,:;]/g, className: 'syntax-operator' },
        ],
        swift: [
            { regex: /\/\/.*/g, className: 'syntax-comment' },
            { regex: /\/\*[\s\S]*?\*\//g, className: 'syntax-comment' },
            { regex: /"(?:\\.|[^"\\])*"/g, className: 'syntax-string' },
            { regex: /\b(break|case|continue|default|defer|do|else|fallthrough|for|if|in|repeat|return|switch|where|while|throw|throws|try|catch)\b/g, className: 'syntax-control' },
            { regex: /\b(associatedtype|class|deinit|enum|extension|fileprivate|func|import|init|inout|internal|let|open|operator|private|protocol|public|rethrows|static|struct|subscript|typealias|var|as|Any|AnyObject|false|is|nil|super|self|Self|true|associativity|convenience|dynamic|didSet|final|get|indirect|infix|lazy|left|mutating|none|nonmutating|optional|override|postfix|precedence|prefix|Protocol|required|right|set|Type|unowned|weak|willSet)\b/g, className: 'syntax-keyword' },
            { regex: /\b(Int|Double|Float|String|Bool|Array|Dictionary|Set|Optional|Print)\b/g, className: 'syntax-builtin' },
            { regex: /\b\d+(\.\d+)?\b/g, className: 'syntax-number' },
            { regex: /\b[a-z_][a-z0-9_]*(?=\s*\()/gi, className: 'syntax-function' },
            { regex: /\b[A-Z][a-zA-Z0-9_]*\b/g, className: 'syntax-class' },
            { regex: /[{}()[\].,:;]/g, className: 'syntax-operator' },
        ],
        c: [
            { regex: /\/\/.*/g, className: 'syntax-comment' },
            { regex: /\/\*[\s\S]*?\*\//g, className: 'syntax-comment' },
            { regex: /"(?:\\.|[^"\\])*"/g, className: 'syntax-string' },
            { regex: /'(?:\\.|[^'\\])*'/g, className: 'syntax-string' },
            { regex: /^#\s*(include|define|undef|if|ifdef|ifndef|else|elif|endif|pragma|error|line)\b/gm, className: 'syntax-control' },
            { regex: /\b(break|case|continue|default|do|else|for|goto|if|return|switch|while)\b/g, className: 'syntax-control' },
            { regex: /\b(auto|char|const|double|enum|extern|float|int|long|register|short|signed|sizeof|static|struct|typedef|union|unsigned|void|volatile|_Bool|_Complex|_Imaginary|inline|restrict)\b/g, className: 'syntax-keyword' },
            { regex: /\b(printf|scanf|malloc|free|memcpy|memset|size_t|int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t)\b/g, className: 'syntax-builtin' },
            { regex: /\b\d+(\.\d+)?\b/g, className: 'syntax-number' },
            { regex: /\b[a-z_][a-z0-9_]*(?=\s*\()/gi, className: 'syntax-function' },
            { regex: /[{}()[\].,:;]/g, className: 'syntax-operator' },
        ],
        cpp: [
            { regex: /\/\/.*/g, className: 'syntax-comment' },
            { regex: /\/\*[\s\S]*?\*\//g, className: 'syntax-comment' },
            { regex: /"(?:\\.|[^"\\])*"/g, className: 'syntax-string' },
            { regex: /'(?:\\.|[^'\\])*'/g, className: 'syntax-string' },
            { regex: /^#\s*(include|define|undef|if|ifdef|ifndef|else|elif|endif|pragma|error|line)\b/gm, className: 'syntax-control' },
            { regex: /\b(break|case|catch|continue|default|do|else|for|goto|if|return|switch|throw|try|while|co_await|co_return|co_yield)\b/g, className: 'syntax-control' },
            { regex: /\b(alignas|alignof|and|and_eq|asm|atomic_cancel|atomic_commit|atomic_noexcept|auto|bitand|bitor|bool|char|char8_t|char16_t|char32_t|class|compl|concept|const|consteval|constexpr|constinit|const_cast|decltype|default|delete|double|dynamic_cast|enum|explicit|export|extern|false|float|friend|inline|int|long|mutable|namespace|new|noexcept|not|not_eq|nullptr|operator|or|or_eq|private|protected|public|reflexpr|register|reinterpret_cast|requires|short|signed|sizeof|static|static_assert|static_cast|struct|synchronized|template|this|thread_local|true|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while|xor|xor_eq)\b/g, className: 'syntax-keyword' },
            { regex: /\b(std|cout|cin|cerr|vector|string|map|set|unique_ptr|shared_ptr|make_shared|make_unique)\b/g, className: 'syntax-builtin' },
            { regex: /\b\d+(\.\d+)?\b/g, className: 'syntax-number' },
            { regex: /\b[a-z_][a-z0-9_]*(?=\s*\()/gi, className: 'syntax-function' },
            { regex: /\b[A-Z][a-zA-Z0-9_]*\b/g, className: 'syntax-class' },
            { regex: /[{}()[\].,:;]/g, className: 'syntax-operator' },
        ],
        csharp: [
            { regex: /\/\/.*/g, className: 'syntax-comment' },
            { regex: /\/\*[\s\S]*?\*\//g, className: 'syntax-comment' },
            { regex: /"(?:\\.|[^"\\])*"/g, className: 'syntax-string' },
            { regex: /'(?:\\.|[^'\\])*'/g, className: 'syntax-string' },
            { regex: /@"(?:[^"]|"")*"/g, className: 'syntax-string' },
            { regex: /\b(break|case|catch|continue|default|do|else|finally|for|foreach|goto|if|return|switch|throw|try|while|await|async|yield)\b/g, className: 'syntax-control' },
            { regex: /\b(abstract|as|base|bool|byte|char|checked|class|const|decimal|delegate|double|enum|event|explicit|extern|false|finally|fixed|float|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|add|alias|ascending|by|descending|dynamic|equals|from|get|global|group|into|join|let|nameof|on|orderby|partial|remove|select|set|unmanaged|value|var|when|where)\b/g, className: 'syntax-keyword' },
            { regex: /\b(Console|WriteLine|List|Dictionary|Enumerable|Task|Guid|DateTime)\b/g, className: 'syntax-builtin' },
            { regex: /\b\d+(\.\d+)?\b/g, className: 'syntax-number' },
            { regex: /\b[a-z_][a-z0-9_]*(?=\s*\()/gi, className: 'syntax-function' },
            { regex: /\b[A-Z][a-zA-Z0-9_]*\b/g, className: 'syntax-class' },
            { regex: /[{}()[\].,:;]/g, className: 'syntax-operator' },
        ],
        css: [
            { regex: /\/\*[\s\S]*?\*\//g, className: 'syntax-comment' },
            { regex: /[:;{},]/g, className: 'syntax-operator' },
            { regex: /#[a-fA-F0-9]{3,6}/g, className: 'syntax-number' },
            { regex: /\b(red|green|blue|white|black|transparent|none|inherit|initial|revert|revert-layer|unset)\b/g, className: 'syntax-keyword' },
            { regex: /[a-z-]+(?=\s*:)/gi, className: 'syntax-property' },
            { regex: /\.[a-z0-9_-]+/gi, className: 'syntax-class' },
            { regex: /#[a-z0-9_-]+/gi, className: 'syntax-id' },
            { regex: /@[a-z-]+/gi, className: 'syntax-control' },
        ],
        html: [
            { regex: /&lt;!--[\s\S]*?--&gt;/g, className: 'syntax-comment' },
            { regex: /&lt;[a-z0-9]+\b/gi, className: 'syntax-keyword' },
            { regex: /&lt;\/[a-z0-9]+\b/gi, className: 'syntax-keyword' },
            { regex: /[a-z-]+(?==)/gi, className: 'syntax-property' },
            { regex: /"(?:\\.|[^"\\])*"/g, className: 'syntax-string' },
            { regex: /&gt;/g, className: 'syntax-keyword' },
        ],
        sql: [
            { regex: /--.*/g, className: 'syntax-comment' },
            { regex: /\/\*[\s\S]*?\*\//g, className: 'syntax-comment' },
            { regex: /'(?:\\.|[^'\\])*'/g, className: 'syntax-string' },
            { regex: /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|AS|IN|AND|OR|NOT|IS|NULL|LIKE|BETWEEN|EXISTS|ALL|ANY|CASE|WHEN|THEN|ELSE|END|UNION|VALUES|INTO|SET|TRUNCATE|DATABASE|SCHEMA|VIEW|INDEX|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|CHECK|DEFAULT|AUTO_INCREMENT|SERIAL|INT|INTEGER|VARCHAR|TEXT|DATE|TIMESTAMP|BOOLEAN|FLOAT|DECIMAL|NUMERIC)\b/gi, className: 'syntax-control' },
            { regex: /\b\d+(\.\d+)?\b/g, className: 'syntax-number' },
        ],
        json: [
            { regex: /"(?:\\.|[^"\\])*"(?=\s*:)/g, className: 'syntax-property' },
            { regex: /"(?:\\.|[^"\\])*"/g, className: 'syntax-string' },
            { regex: /\b(true|false|null)\b/g, className: 'syntax-keyword' },
            { regex: /\b\d+(\.\d+)?\b/g, className: 'syntax-number' },
        ]
    };

    const languageRules = rules[language] || rules.javascript;
    const allTokens: Token[] = [];

    // Find all matches for each rule
    languageRules.forEach((rule) => {
        let match;
        // Important: reset regex state if it has global flag
        rule.regex.lastIndex = 0;
        while ((match = rule.regex.exec(code)) !== null) {
            allTokens.push({
                start: match.index,
                end: match.index + match[0].length,
                className: rule.className,
                text: match[0]
            });
            // Handle zero-length matches to avoid infinite loop
            if (match.index === rule.regex.lastIndex) {
                rule.regex.lastIndex++;
            }
        }
    });

    // Sort tokens by start position (ascending) and then by end position (descending - longer matches first)
    allTokens.sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        return b.end - a.end;
    });

    // Filter out overlapping tokens (keep the first one that starts earliest and is longest)
    const filteredTokens: Token[] = [];
    let lastEnd = 0;
    allTokens.forEach(token => {
        if (token.start >= lastEnd) {
            filteredTokens.push(token);
            lastEnd = token.end;
        }
    });

    // Build the final HTML string
    let result = '';
    let lastIndex = 0;
    filteredTokens.forEach(token => {
        // Add plain text before the token
        if (token.start > lastIndex) {
            result += escapeHtml(code.substring(lastIndex, token.start));
        }
        // Add the highlighted token
        result += `<span class="${token.className}">${escapeHtml(token.text)}</span>`;
        lastIndex = token.end;
    });

    // Add remaining plain text
    if (lastIndex < code.length) {
        result += escapeHtml(code.substring(lastIndex));
    }

    return result;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
