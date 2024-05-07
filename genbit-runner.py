from genbit.genbit_metrics import GenBitMetrics

language_code = "en"

# Create a GenBit object with the desired settings:

genbit_metrics_object = GenBitMetrics(language_code, context_window=5, distance_weight=0.95, percentile_cutoff=80)


# Let's say you want to use GenBit with a test sentence, you can add the sentence to GenBit:
test_text = ["I think she does not like cats. I think he does not like cats.", "He is a dog person."]

genbit_metrics_object.add_data(test_text, tokenized=False)


# To generate the gender bias metrics, we run `get_metrics` by setting `output_statistics` and `output_word_lists` to false, we can reduce the number of metrics created.


metrics = genbit_metrics_object.get_metrics(output_statistics=True, output_word_list=True)
