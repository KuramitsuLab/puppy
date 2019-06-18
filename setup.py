from setuptools import setup

setup(
    name = 'arare',
    version = '0.1.0',
    url = 'https://github.com/KuramitsuLab/arare.git',
    license = 'KuramitsuLab',
    author = 'Kuramitsu Lab',
    description = 'hoge',
    install_requires = ['setuptools', 'flask'],
 	packages = ['arare', 'arare/front'],
 	package_data = {'arare/front': ['*.json', '*.js', 'src/*.ts',
        'static/audio/*.mp3', 'static/image/*.png', 'static/js/*.js', 'static/*'],},
 	entry_points = {
 		'console_scripts': [
 			'arare = arare.run:main'
 		]
 	},
)
