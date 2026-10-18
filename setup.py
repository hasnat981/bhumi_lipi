from setuptools import setup, find_packages

setup(
    name="bhumi",
    version="1.0.0",
    packages=find_packages(),
    py_modules=["server"],
    install_requires=["cryptography>=42"],
)
