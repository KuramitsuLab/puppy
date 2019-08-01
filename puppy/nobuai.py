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
        print('hiyoko is not available')
        return lambda x: None
    from gensim.models import KeyedVectors
    model = KeyedVectors.load_word2vec_format(str(model_path), binary=True)

    def find_from_model(w):
        if w not in model:
            return None
        sim_max = 0
        key_max = ''
        for key in KnowledgeBase.keys():
            if key not in model:
                continue
            sim = model.similarity(w, key)
            if sim > sim_max:
                sim_max = sim
                key_max = key
        return key_max

    return find_from_model


load_KnowledgeBase('nlp_dict/matter_dict.txt')
load_SimpleDictionary('nlp_dict/color_dict.txt', 'color', '色')
def find_sim(x): return None
# print(KnowledgeBase)


Empty = {}


def find_data(phrase: str):
    prefix = ''
    key = phrase
    while len(key) > 0:
        if key in KnowledgeBase:
            return merge(KnowledgeBase[key], find_data(prefix))
        # wordvec で 近似する
        keysim = find_sim(key)
        if keysim is not None:
            return merge(KnowledgeBase[keysim], find_data(prefix))
        # n-gramする
        prefix += key[0]
        key = key[1:]
    return Empty


def find_value(key, property, default=None):
    data = find_data(key)
    if property in data:
        return data[property]
    return default


def conv_phrase(phrase, d):
    if 'は' in phrase:
        pos = phrase.find('は')
        key = phrase[0:pos]
        key = find_value(key, 'property', key)
        value = find_value(phrase[pos+1:], property)
        if value is not None:
            d[property] = value
            return
    found = find_data(phrase)
    if len(found) == 0:
        print('@見つかりません', phrase)
    for key in found:
        d[key] = found[key]


def conv(*phrases):
    d = {}
    for phrase in phrases:
        conv_phrase(phrase, d)
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
