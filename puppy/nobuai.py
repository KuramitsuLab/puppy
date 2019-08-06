from pathlib import Path
import json


def getRootPath(subdir='data'):
    return Path(__file__).parent.absolute() / subdir


KnowledgeBase = {}


def jsondec(x):
    if isinstance(x, str):
        try:
            return json.loads(x)
        except:
            print('[JSON ERROR]', x)
            return {}
    return x


def merge(x, y='{}'):
    z = {}
    z.update(jsondec(x))
    z.update(jsondec(y))
    return z


def load_KnowledgeBase(path):
    with open(path) as f:
        for line in f:
            if line.startswith('#'):
                continue
            pos = line.find('{')
            if pos == -1:
                continue
            keys = line[0:pos].strip()
            defined = line[pos:]
            if '<:' in keys:
                keys, parent = map(lambda x: x.strip(), keys.split('<:'))
                if parent in KnowledgeBase:
                    defined = merge(KnowledgeBase[parent], defined)
                else:
                    print('undefined', parent)
            for key in map(lambda x: x.strip(), keys.split(',')):
                if key in KnowledgeBase:
                    print('redefined', key)
                KnowledgeBase[key] = defined

# path nlp_dict/color_dict.txt


def load_SimpleDictionary(path, property, suffix=None):
    with open(path) as f:
        for line in f:
            if line.startswith('#'):
                continue
            if ' ' in line or '\t' in line:
                key, value = line.split()
                if suffix is not None and key.endswith(suffix):
                    key = key[:-len(suffix)]
                value = f'{{"{property}": "{value}"}}'
                if key in KnowledgeBase:
                    KnowledgeBase[key] = merge(KnowledgeBase[key], value)
                else:
                    KnowledgeBase[key] = value
                if suffix is not None:
                    key += suffix
                    if key in KnowledgeBase:
                        KnowledgeBase[key] = merge(KnowledgeBase[key], value)
                    else:
                        KnowledgeBase[key] = value


def init_wordvec(path='nlp_dict/entity_vector.model.bin'):
    model_path = getRootPath(path)
    if not model_path.exists():
        print('nobuai is not available')
        return lambda x, pinfo, property=None: None
    from gensim.models import KeyedVectors
    model = KeyedVectors.load_word2vec_format(
        str(model_path), limit=500000, binary=True)
    base = [x for x in KnowledgeBase.keys() if x in model]
    domains = {}

    def domain(property):
        if property is None:
            return base
        if not property in domains:
            domains[property] = [
                x for x in base if property in KnowledgeBase[x]]
        return domains[property]

    def find_from_model(w, pinfo, property=None):
        if w not in model:
            return None
        sim_max = 0.0
        sim_w = None
        for w2 in domain(property):
            sim = model.similarity(w, w2)
            if sim > sim_max:
                sim_max = sim
                sim_w = w2
        if sim_w is not None:
            print('@word2vec', w, sim_w, sim_max)
            pinfo(f'「{w}」は{sim_w}(類似度{sim_max:.4})と解釈されました')
        return sim_w

    return find_from_model


load_KnowledgeBase('nlp_dict/matter_dict.txt')
load_SimpleDictionary('nlp_dict/color_dict.txt', 'color', '色')
#find_sim = init_wordvec('nlp_dict/entity_vector.model.bin')
find_sim = init_wordvec('nlp_dict/word2vec.model.bin')
# print(KnowledgeBase)


Empty = {}


def suffix(w):
    if w.endswith('の'):
        return w[:-1]
    return w


def find_data(phrase: str, pinfo, property=None):
    prefix = ''
    w = phrase
    while len(w) > 0:
        if w in KnowledgeBase:
            return merge(KnowledgeBase[w], find_data(suffix(prefix), pinfo, None))
        # wordvec で 近似する
        simw = find_sim(w, pinfo, property)
        if simw is not None:
            return merge(KnowledgeBase[simw], find_data(suffix(prefix), pinfo, None))
        # n-gramする
        prefix += w[0]
        w = w[1:]
    return Empty


def find_value(key, property, pinfo, default=None):
    data = find_data(key, pinfo, property)
    if property in data:
        return data[property]
    return default


def conv_phrase(phrase, pinfo, d):
    # ある性質についての表現か調べる. 例. 色は赤
    if 'は' in phrase:  # Ad hoc な実装
        pos = phrase.find('は')
        key = phrase[0:pos]    # 色
        key = find_value(key, 'property', pinfo, key)
        if key is not None:  # もし性質が辞書にあったら、
            # key='color' になっている値の方を変換する
            value = find_value(phrase[pos+1:], key, pinfo)
            if value is not None:
                d[key] = value
                return
    # 特定の性質でない
    found = find_data(phrase, pinfo, None)
    if len(found) == 0:
        print('@見つかりません', phrase)
    for key in found:
        d[key] = found[key]


def conv(*phrases):
    def pinfo(x): return print(x)
    d = {}
    for phrase in phrases:
        conv_phrase(phrase, pinfo, d)
    return d


def conv2(phrase, pinfo=lambda x: None):
    d = {}
    conv_phrase(phrase, pinfo, d)
    return d


# main スクリプト
if __name__ == "__main__":
    print(conv('赤いボール', 'よく跳ねる'))
    print(conv('跳ねないボール', '色は緑'))
    print(conv('サッカーボール', '少し跳ねる'))
    print(conv('壁', '少し跳ねる'))
    #find_word = init_hiyoko()
    # find_word('ひよこ')

__package__ = 'nobuai'
