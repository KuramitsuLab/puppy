from gensim.models import KeyedVectors

model_dir = 'entity_vector/entity_vector.model.bin'
model = KeyedVectors.load_word2vec_format(model_dir, binary=True)

def load_color_dict(d):
  f = open('nlp_dict/color_dict.txt')
  for line in f:
    key, rgb = line.split()
    d[key] = rgb
  f.close()
  return d

def load_obj_dict(d):
  f = open('nlp_dict/obj_dict.txt')
  for line in f:
    key, obj = line.split()
    d[key] = obj
  f.close()
  return d

# d = load_color_dict({})
# d = load_obj_dict({})

def sim_color(w, d = d):
  sim_max = 0
  key_max = ''
  for key in d.keys():
    if key in model:
      sim = model.similarity(w, key)
      if sim > sim_max:
        sim_max = sim
        key_max =key
  return ( key_max, d[key_max])

def sim_obj(w, d = d):
  sim_max = 0
  key_max = ''
  for key in d.keys():
    if key in model:
      sim = model.similarity(w, key)
      if sim > sim_max:
        sim_max = sim
        key_max =key
  return ( key_max, d[key_max])

