from pathlib import Path


def getRootPath(subdir='data'):
    return Path(__file__).parent.absolute() / subdir


def init_hiyoko():
    model_path = getRootPath('nlp_dict/entity_vector.model.bin')
    if not model_path.exists():
        print('hiyoko is not available')
        return
    from gensim.models import KeyedVectors
    model = KeyedVectors.load_word2vec_format(str(model_path), binary=True)

    # path nlp_dict/color_dict.txt
    def load_dict(path, d=None):
        if d == None:
            d = {}
        with open(path) as f:
            for line in f:
                key, rgb = line.split()
                if key in model:
                    d[key] = rgb
                else:
                    print('モデルにない用語', key)
        return d

    color_dict = load_dict('nlp_dict/color_dict.txt')

    def find_word(w, words=color_dict):
        sim_max = 0
        key_max = ''
        for key in words.keys():
            sim = model.similarity(w, key)
            if sim > sim_max:
                sim_max = sim
                key_max = key
        return (key_max, words[key_max])

    return find_word

# main スクリプト


def find_word(x): return (x, x)


if __name__ == "__main__":
    find_word = init_hiyoko()
    find_word('ひよこ')

__package__ = 'hiyoko'
